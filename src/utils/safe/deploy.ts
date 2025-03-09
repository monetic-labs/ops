import { Address, encodeFunctionData } from "viem";
import { SafeAccountV0_3_0 as SafeAccount, DEFAULT_SECP256R1_PRECOMPILE_ADDRESS } from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";
import { safeAbi } from "@/utils/abi/safe";
import {
  createSafeAccount,
  createAndSendSponsoredUserOp,
  createSubAccountDeploymentTransactions,
  sendAndTrackUserOperation,
  createSignedUserOperation,
  createSettlementOperationWithApproval,
} from "@/utils/safe";
import { createApproveHashTemplate } from "@/utils/safe/templates";

interface DeploymentCallbacks {
  onSent?: () => void;
  onSuccess?: (safeAddress: Address) => void;
  onError?: (error: Error) => void;
}

interface DeploymentConfig {
  individualSafeAddress: Address;
  credentials: WebAuthnCredentials;
  signerAddresses: Address[];
  threshold: number;
  callbacks?: DeploymentCallbacks;
}

/**
 * Deploys a new Safe account through an existing individual safe account
 * This is a nested transaction where:
 * 1. Individual account approves the deployment
 * 2. New safe account is deployed with the approval
 */
export const deploySafeAccount = async ({
  individualSafeAddress,
  credentials,
  signerAddresses,
  threshold,
  callbacks,
}: DeploymentConfig): Promise<{ safeAddress: Address }> => {
  try {
    callbacks?.onSent?.();

    // Initialize WebAuthn helper
    const webauthnHelper = new WebAuthnHelper({
      credentialId: credentials.credentialId,
      publicKey: credentials.publicKey,
    });

    // Create the individual account instance
    const individualAccount = new SafeAccount(individualSafeAddress);

    // Create the new safe account to be deployed
    const { address: safeSubAccountAddress, instance: safeAccount } = createSafeAccount({
      signers: [individualSafeAddress],
      isWebAuthn: false,
    });

    // Create deployment transactions
    const deploymentTxs = await createSubAccountDeploymentTransactions(
      safeAccount,
      individualSafeAddress,
      signerAddresses,
      threshold
    );

    // Create and sponsor deployment operation
    const { userOp: deploymentUserOp, hash: deploymentHash } = await createAndSendSponsoredUserOp(
      safeSubAccountAddress,
      deploymentTxs,
      {
        signer: individualSafeAddress,
        isWebAuthn: false,
      }
    );

    // Create approval transaction from individual account using the helper function
    const approveHashTransaction = createApproveHashTemplate(safeSubAccountAddress, deploymentHash);

    // Get approval from individual account
    const { userOp: individualApprovalOp, hash: approvalHash } = await createAndSendSponsoredUserOp(
      individualSafeAddress,
      [approveHashTransaction],
      {
        signer: credentials.publicKey,
        isWebAuthn: true,
      }
    );

    // Create a promise that will resolve when the entire process is complete
    return new Promise((resolve, reject) => {
      // Sign and send the approval
      webauthnHelper
        .signMessage(approvalHash)
        .then(({ signature }) => {
          const signedApprovalOp = createSignedUserOperation(
            individualApprovalOp,
            { signer: credentials.publicKey, signature },
            { precompileAddress: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS }
          );

          // Track the approval operation
          sendAndTrackUserOperation(individualAccount, signedApprovalOp, {
            onSent: callbacks?.onSent,
            onError: (error) => {
              console.error("Error in approval operation:", error);
              callbacks?.onError?.(error);
              reject(error);
            },
            onSuccess: async () => {
              try {
                // Execute the deployment with approval
                const finalDeploymentOp = createSettlementOperationWithApproval(
                  individualSafeAddress,
                  deploymentUserOp,
                  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS
                );

                // Track the deployment operation
                await sendAndTrackUserOperation(safeAccount, finalDeploymentOp, {
                  onSent: callbacks?.onSent,
                  onSuccess: () => {
                    callbacks?.onSuccess?.(safeSubAccountAddress);
                    resolve({ safeAddress: safeSubAccountAddress });
                  },
                  onError: (error) => {
                    console.error("Error in deployment operation:", error);
                    callbacks?.onError?.(error);
                    reject(error);
                  },
                });
              } catch (error) {
                console.error("Error in deployment phase:", error);
                callbacks?.onError?.(error as Error);
                reject(error);
              }
            },
          }).catch((error) => {
            console.error("Error in approval phase:", error);
            callbacks?.onError?.(error as Error);
            reject(error);
          });
        })
        .catch((error) => {
          console.error("Error signing message:", error);
          callbacks?.onError?.(error as Error);
          reject(error);
        });
    });
  } catch (error) {
    console.error("Error deploying safe account:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

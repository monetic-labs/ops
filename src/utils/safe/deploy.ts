import { Address } from "viem";
import {
  SafeAccountV0_3_0 as SafeAccount,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  MetaTransaction,
} from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";
import {
  createSafeAccount,
  createSubAccountDeploymentTransactions,
  createAndSendSponsoredUserOp,
  sendAndTrackUserOperation,
  createSignedUserOperation,
  createSettlementOperationWithApproval,
} from "@/utils/safe";
import { createApproveHashTemplate } from "./templates";

interface DeploymentCallbacks {
  onPreparing?: () => void;
  onSigning?: () => void;
  onSigningComplete?: () => void;
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
 * Deploys a new Safe account (settlement account) through an existing individual safe account
 * The individual safe account is controlled by WebAuthn signers
 * The settlement account is owned by the individual safe account
 *
 * This follows the nested accounts pattern from Candide:
 * 1. Create settlement account with individual account as owner
 * 2. Individual account approves the settlement account deployment
 * 3. Settlement account is deployed with the approval
 */
export const deploySafeAccount = async ({
  individualSafeAddress,
  credentials,
  signerAddresses,
  threshold,
  callbacks,
}: DeploymentConfig): Promise<{ safeAddress: Address }> => {
  try {
    callbacks?.onPreparing?.();

    const webauthnHelper = new WebAuthnHelper({
      publicKey: credentials.publicKey,
      credentialId: credentials.credentialId,
    });

    // Create account instances
    const individualAccount = new SafeAccount(individualSafeAddress);

    // Create the new settlement account to be deployed
    const { address: settlementAccountAddress, instance: settlementAccount } = createSafeAccount({
      signers: [individualSafeAddress],
      isWebAuthn: false,
    });

    // Create deployment transactions
    const deploymentTxs = await createSubAccountDeploymentTransactions(
      settlementAccount,
      individualSafeAddress,
      signerAddresses,
      threshold
    );

    // Create and sponsor settlement account operation
    const { userOp: settlementUserOp, hash: settlementOpHash } = await createAndSendSponsoredUserOp(
      settlementAccountAddress,
      deploymentTxs,
      {
        signer: individualSafeAddress,
        isWebAuthn: false,
      }
    );

    // Create approval transaction from individual account
    const approveHashTransaction = createApproveHashTemplate(settlementAccountAddress, settlementOpHash);

    callbacks?.onSigning?.();

    // Create and sponsor individual account operation
    const { userOp: individualUserOp, hash: approvalHash } = await createAndSendSponsoredUserOp(
      individualSafeAddress,
      [approveHashTransaction],
      {
        signer: credentials.publicKey,
        isWebAuthn: true,
      }
    );

    // Sign and format the approval operation
    const { signature } = await webauthnHelper.signMessage(approvalHash);
    const signedIndividualOp = createSignedUserOperation(
      individualUserOp,
      { signer: credentials.publicKey, signature },
      { precompileAddress: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS }
    );

    // Call onSigningComplete callback after signing is complete
    callbacks?.onSigningComplete?.();

    // Create a promise that will resolve when the entire process is complete
    return new Promise((resolve, reject) => {
      // Send and track both operations
      sendAndTrackUserOperation(individualAccount, signedIndividualOp, {
        onSent: callbacks?.onSent,
        onError: (error) => {
          callbacks?.onError?.(error);
          reject(error);
        },
        onSuccess: async () => {
          try {
            // Create and send settlement operation with approval
            const finalSettlementOp = createSettlementOperationWithApproval(
              individualSafeAddress,
              settlementUserOp,
              DEFAULT_SECP256R1_PRECOMPILE_ADDRESS
            );

            // Only call onSent callback here, as this is when the final transaction is sent
            callbacks?.onSent?.();

            await sendAndTrackUserOperation(settlementAccount, finalSettlementOp, {
              onSent: callbacks?.onSent,
              onSuccess: () => {
                // Only call onSuccess when the entire process is complete
                callbacks?.onSuccess?.(settlementAccountAddress);
                resolve({ safeAddress: settlementAccountAddress });
              },
              onError: (error) => {
                callbacks?.onError?.(error);
                reject(error);
              },
            });
          } catch (error) {
            console.error("Error in deployment (second phase):", error);
            callbacks?.onError?.(error as Error);
            reject(error);
          }
        },
      }).catch((error) => {
        console.error("Error in deployment (first phase):", error);
        callbacks?.onError?.(error as Error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error in deployment setup:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

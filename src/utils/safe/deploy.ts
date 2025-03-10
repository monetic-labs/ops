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
  getUserOpHash,
} from "@/utils/safe";
import { createApproveHashTemplate } from "./templates";
import { BUNDLER_URL, PUBLIC_RPC } from "@/config/web3";

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

    console.log("Starting safe account deployment with parameters:", {
      individualSafeAddress,
      signerAddresses,
      threshold,
    });

    // Initialize WebAuthn helper for the individual account
    const webauthnHelper = new WebAuthnHelper({
      credentialId: credentials.credentialId,
      publicKey: credentials.publicKey,
    });

    // Create the individual account instance
    const individualAccount = new SafeAccount(individualSafeAddress);

    // Create the new settlement account to be deployed
    const { address: settlementAccountAddress, instance: settlementAccount } = createSafeAccount({
      signers: [individualSafeAddress],
      isWebAuthn: false,
    });

    console.log("Created settlement account:", settlementAccountAddress);

    // Create deployment transactions
    const deploymentTxs = await createSubAccountDeploymentTransactions(
      settlementAccount,
      individualSafeAddress,
      signerAddresses,
      threshold
    );

    console.log("Created deployment transactions");

    // Create and sponsor settlement account operation
    const { userOp: settlementUserOp, hash: settlementOpHash } = await createAndSendSponsoredUserOp(
      settlementAccountAddress,
      deploymentTxs,
      {
        signer: individualSafeAddress,
        isWebAuthn: false,
      }
    );

    console.log("Created and sponsored settlement user operation");

    // Create approveHash transaction for the individual account
    const approveHashTransaction = createApproveHashTemplate(settlementAccountAddress, settlementOpHash);

    callbacks?.onSigning?.();

    // Create and sponsor individual account operation to approve the settlement operation
    const { userOp: individualUserOp, hash: approvalHash } = await createAndSendSponsoredUserOp(
      individualSafeAddress,
      [approveHashTransaction], // Add the approveHash transaction
      {
        signer: credentials.publicKey,
        isWebAuthn: true,
      }
    );

    console.log("Created and sponsored individual user operation with approveHash");

    // Sign the approval hash with WebAuthn
    const { signature } = await webauthnHelper.signMessage(approvalHash);
    console.log("Signed approval hash with WebAuthn");

    // Create signed individual operation
    const signedIndividualOp = createSignedUserOperation(
      individualUserOp,
      { signer: credentials.publicKey, signature },
      { precompileAddress: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS }
    );

    console.log("Created signed individual operation");

    callbacks?.onSigningComplete?.();

    // Create a promise that will resolve when the entire process is complete
    return new Promise((resolve, reject) => {
      // Send and track the individual operation
      sendAndTrackUserOperation(individualAccount, signedIndividualOp, {
        onSent: callbacks?.onSent,
        onError: (error) => {
          console.error("Error in individual operation:", error);
          callbacks?.onError?.(error);
          reject(error);
        },
        onSuccess: async () => {
          try {
            console.log("Individual operation successful - approveHash confirmed");

            // Create settlement operation with approval
            const finalSettlementOp = createSettlementOperationWithApproval(
              individualSafeAddress,
              settlementUserOp,
              DEFAULT_SECP256R1_PRECOMPILE_ADDRESS
            );

            console.log("Created final settlement operation with approval");

            // Send and track the settlement operation
            await sendAndTrackUserOperation(settlementAccount, finalSettlementOp, {
              onSent: () => {
                console.log("Settlement operation sent");
                callbacks?.onSent?.();
              },
              onSuccess: () => {
                console.log("Settlement operation successful - account deployed");
                callbacks?.onSuccess?.(settlementAccountAddress);
                resolve({ safeAddress: settlementAccountAddress });
              },
              onError: (error) => {
                console.error("Error in settlement operation:", error);
                callbacks?.onError?.(error);
                reject(error);
              },
            });
          } catch (error) {
            console.error("Error in settlement phase:", error);
            callbacks?.onError?.(error as Error);
            reject(error);
          }
        },
      }).catch((error) => {
        console.error("Error in individual phase:", error);
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

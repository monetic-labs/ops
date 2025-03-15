import { Address } from "viem";
import {
  SafeAccountV0_3_0 as SafeAccount,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  MetaTransaction,
} from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";
import {
  createAndSendSponsoredUserOp,
  sendAndTrackUserOperation,
  createSignedUserOperation,
  createSettlementOperationWithApproval,
  OperationTrackingCallbacks,
} from "../core/operations";
import { createApproveHashTemplate } from "../templates";

/**
 * Standard callback interface for nested transactions
 */
export interface NestedTransactionCallbacks extends OperationTrackingCallbacks {
  onPreparing?: () => void;
  onSigning?: () => void;
  onSigningComplete?: () => void;
}

/**
 * Configuration for nested transactions
 */
export interface NestedTransactionConfig {
  fromSafeAddress: Address;
  throughSafeAddress: Address;
  transactions: MetaTransaction[];
  credentials: WebAuthnCredentials;
  callbacks?: NestedTransactionCallbacks;
}

/**
 * Executes a nested transaction between safes
 * This is a nested transaction where:
 * 1. First safe approves the transaction
 * 2. Second safe executes the transaction with the approval
 *
 * Usage:
 * - For adding signers: Use with createAddOwnerTemplate
 * - For ERC20 transfers: Use with createERC20TransferTemplate
 * - For Rain withdrawals: Use with createRainWithdrawalTemplate
 *
 * @param config Configuration for the nested transaction
 * @returns Promise resolving to a success indicator
 */
export const executeNestedTransaction = async ({
  fromSafeAddress,
  throughSafeAddress,
  transactions,
  credentials,
  callbacks,
}: NestedTransactionConfig): Promise<{ success: boolean }> => {
  try {
    callbacks?.onPreparing?.();

    const webauthnHelper = new WebAuthnHelper({
      publicKey: credentials.publicKey,
      credentialId: credentials.credentialId,
    });

    // Create account instances
    const fromSafe = new SafeAccount(fromSafeAddress);
    const throughSafe = new SafeAccount(throughSafeAddress);

    // Create and sponsor through-safe operation
    const { userOp: throughSafeUserOp, hash: throughSafeOpHash } = await createAndSendSponsoredUserOp(
      throughSafeAddress,
      transactions,
      {
        signer: fromSafeAddress,
        isWebAuthn: false,
      }
    );

    // Create approval transaction from first safe
    const approveHashTransaction = createApproveHashTemplate(throughSafeAddress, throughSafeOpHash);

    callbacks?.onSigning?.();

    // Create and sponsor from-safe operation
    const { userOp: fromSafeUserOp, hash: approvalHash } = await createAndSendSponsoredUserOp(
      fromSafeAddress,
      [approveHashTransaction],
      {
        signer: credentials.publicKey,
        isWebAuthn: true,
      }
    );

    // Sign and format the approval operation
    const { signature } = await webauthnHelper.signMessage(approvalHash);
    const signedFromSafeOp = createSignedUserOperation(
      fromSafeUserOp,
      { signer: credentials.publicKey, signature },
      { precompileAddress: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS }
    );

    // Call onSigningComplete callback after signing is complete
    callbacks?.onSigningComplete?.();

    // Create a promise that will resolve when the entire process is complete
    return new Promise((resolve, reject) => {
      // Send and track both operations
      sendAndTrackUserOperation(fromSafe, signedFromSafeOp, {
        onSent: callbacks?.onSent,
        onError: (error) => {
          callbacks?.onError?.(error);
          reject(error);
        },
        onSuccess: async () => {
          try {
            // Create and send through-safe operation with approval
            const finalThroughSafeOp = createSettlementOperationWithApproval(
              fromSafeAddress,
              throughSafeUserOp,
              DEFAULT_SECP256R1_PRECOMPILE_ADDRESS
            );

            // Only call onSent callback here, as this is when the final transaction is sent
            callbacks?.onSent?.();

            await sendAndTrackUserOperation(throughSafe, finalThroughSafeOp, {
              onError: (error) => {
                callbacks?.onError?.(error);
                reject(error);
              },
              onSuccess: () => {
                // Only call onSuccess when the entire process is complete
                callbacks?.onSuccess?.();
                resolve({ success: true });
              },
            });
          } catch (error) {
            console.error("Error in nested transaction (second phase):", error);
            callbacks?.onError?.(error as Error);
            reject(error);
          }
        },
      }).catch((error) => {
        console.error("Error in nested transaction (first phase):", error);
        callbacks?.onError?.(error as Error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error in nested transaction setup:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

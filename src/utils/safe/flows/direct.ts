import { Address } from "viem";
import { MetaTransaction, SafeAccountV0_3_0 as SafeAccount } from "abstractionkit";

import { WebAuthnCredentials } from "@/types/webauthn";
import { WebAuthnHelper } from "@/utils/webauthn";
import { createAndSendSponsoredUserOp, sendUserOperation, OperationTrackingCallbacks } from "../core/operations";

/**
 * Standard callback interface for direct transactions
 */
export interface DirectTransactionCallbacks extends OperationTrackingCallbacks {
  onPreparing?: () => void;
  onSigning?: () => void;
  onSigningComplete?: () => void;
}

/**
 * Configuration for direct transactions
 */
export interface DirectTransactionConfig {
  safeAddress: Address;
  transactions: MetaTransaction[];
  credentials: WebAuthnCredentials;
  callbacks?: DirectTransactionCallbacks;
}

/**
 * Executes a transaction directly from a Safe account
 * The transaction is executed in a single operation, signed by the provided credentials
 *
 * @param config Configuration for the transaction
 * @returns Promise resolving to a success indicator
 */
export const executeDirectTransaction = async ({
  safeAddress,
  transactions,
  credentials,
  callbacks,
}: DirectTransactionConfig): Promise<{ success: boolean }> => {
  try {
    callbacks?.onPreparing?.();

    const webauthnHelper = new WebAuthnHelper({
      publicKey: credentials.publicKey,
      credentialId: credentials.credentialId,
    });

    // Create and sponsor the operation
    const { userOp, hash } = await createAndSendSponsoredUserOp(safeAddress, transactions, {
      signer: credentials.publicKey,
      isWebAuthn: true,
    });

    callbacks?.onSigning?.();

    // Sign the operation
    const { signature } = await webauthnHelper.signMessage(hash);

    callbacks?.onSigningComplete?.();

    // Send the operation
    const response = await sendUserOperation(safeAddress, userOp, {
      signer: credentials.publicKey,
      signature,
    });

    callbacks?.onSent?.();

    // Wait for the transaction to complete
    const receipt = await response.included();

    if (!receipt.success) {
      throw new Error("Transaction execution failed");
    }

    callbacks?.onSuccess?.();
    return { success: true };
  } catch (error) {
    console.error("Error executing direct transaction:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

import { Address } from "viem";
import { MetaTransaction, UserOperationReceipt } from "abstractionkit";

import { WebAuthnCredentials } from "@/types/webauthn";
import { WebAuthnHelper } from "@/utils/webauthn";

import { createAndSendSponsoredUserOp, sendUserOperation, OperationTrackingCallbacks } from "../core/operations";

const logPrefix = "[Direct Transaction]";

/**
 * Standard callback interface for direct transactions
 */
export interface DirectTransactionCallbacks {
  onPreparing?: () => void;
  onSigning?: () => void;
  onSigningComplete?: () => void;
  onSuccess?: (receipt: UserOperationReceipt) => void;
  onError?: (error: any) => void;
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
}: DirectTransactionConfig): Promise<UserOperationReceipt | void> => {
  console.info(`${logPrefix} Executing ${transactions.length} transaction(s) for Safe: ${safeAddress}`, {
    transactions,
  });
  try {
    callbacks?.onPreparing?.();

    const webauthnHelper = new WebAuthnHelper({
      publicKey: credentials.publicKey,
      credentialId: credentials.credentialId,
      rpId: credentials.rpId,
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

    const receipt = await response.included();

    // Pass the receipt to the success callback
    console.info(`${logPrefix} Transaction successful for Safe: ${safeAddress}. Receipt:`, receipt);
    callbacks?.onSuccess?.(receipt);
    return receipt;
  } catch (error: any) {
    console.error(`${logPrefix} Transaction failed for Safe: ${safeAddress}:`, error);
    callbacks?.onError?.(error);
    throw error;
  }
};

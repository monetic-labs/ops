import { Address } from "viem";
import { MetaTransaction, SafeAccountV0_3_0 as SafeAccount } from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";

import { createAndSendSponsoredUserOp, sendUserOperation } from "./operations";

/**
 * Executes a set of transactions for a Safe account
 *
 * @param accountAddress The account address
 * @param transactions Array of transactions to execute
 * @param credentials WebAuthn credentials for signing
 * @param options Additional options
 * @returns Receipt from the transaction
 */
export async function executeSafeTransactions(
  accountAddress: Address,
  transactions: MetaTransaction[],
  credentials: WebAuthnCredentials,
  options: {
    safeAccount?: SafeAccount;
    onBeforeSigning?: () => void;
  } = {}
) {
  // Initialize WebAuthn helper
  const webauthnHelper = new WebAuthnHelper({
    credentialId: credentials.credentialId,
    publicKey: credentials.publicKey,
    rpId: credentials.rpId,
  });

  // Create and send the user operation
  const { userOp, hash } = await createAndSendSponsoredUserOp(accountAddress, transactions, {
    signer: credentials.publicKey,
    isWebAuthn: true,
    safeAccount: options.safeAccount,
  });

  // Call the before signing callback if provided
  if (options.onBeforeSigning) {
    options.onBeforeSigning();
  }

  // Sign the operation
  const { signature } = await webauthnHelper.signMessage(hash);

  // Send the operation
  const response = await sendUserOperation(accountAddress, userOp, {
    signer: credentials.publicKey,
    signature,
  });

  // Wait for and return the receipt
  return await response.included();
}

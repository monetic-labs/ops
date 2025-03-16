import { Address } from "viem";
import { SafeAccountV0_3_0 as SafeAccount, WebauthnPublicKey } from "abstractionkit";

import { PasskeyCredentials, WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";

import { createAddOwnerTemplate } from "../templates";
import { executeDirectTransaction } from "../flows/direct";

/**
 * Creates a new passkey and returns the credentials
 *
 * @param email User's email for passkey creation
 * @returns WebAuthn credentials for the new passkey
 */
export async function createPasskeyCredentials(email: string): Promise<WebAuthnCredentials> {
  const passkeyResult = await WebAuthnHelper.createPasskey(email);

  if (!passkeyResult?.credentialId || !passkeyResult?.publicKey || !passkeyResult?.publicKeyCoordinates) {
    throw new Error("Failed to create passkey");
  }

  return {
    credentialId: passkeyResult.credentialId,
    publicKey: passkeyResult.publicKeyCoordinates,
  };
}

// Separate interface without extending DirectTransactionCallbacks
interface AddPasskeyCallbacks {
  onPreparing?: () => void;
  onSigning?: () => void;
  onSigningComplete?: () => void;
  onSent?: () => void;
  onError?: (error: Error) => void;
  onSuccess?: (result: { credentialId: string; publicKey: string; publicKeyCoordinates: WebauthnPublicKey }) => void;
}

interface AddPasskeyConfig {
  safeAddress: Address;
  userEmail: string;
  threshold?: number;
  credential: PasskeyCredentials;
  callbacks?: AddPasskeyCallbacks;
}

/**
 * Adds a new WebAuthn signer (passkey) to an existing Safe account
 * This maintains the existing threshold unless specified otherwise
 *
 * @param config Configuration for adding a passkey
 * @returns The new passkey credentials
 */
export async function addPasskeyToSafe({
  safeAddress,
  userEmail,
  threshold = 1,
  credential,
  callbacks,
}: AddPasskeyConfig) {
  try {
    // Create the new passkey for the user to add
    const result = await WebAuthnHelper.createPasskey(userEmail);

    if (!result?.credentialId || !result?.publicKey || !result?.publicKeyCoordinates) {
      throw new Error("Failed to create passkey");
    }

    // Get the current Safe account
    const safeAccount = new SafeAccount(safeAddress);

    // Create transaction to add the new signer while keeping the same threshold
    const addOwnerTxs = await createAddOwnerTemplate(safeAccount, result.publicKeyCoordinates, threshold);

    // Execute the transaction
    await executeDirectTransaction({
      safeAddress,
      transactions: addOwnerTxs,
      credentials: {
        credentialId: credential.credentialId,
        publicKey: credential.publicKey,
      },
      callbacks: {
        onPreparing: callbacks?.onPreparing,
        onSigning: callbacks?.onSigning,
        onSigningComplete: callbacks?.onSigningComplete,
        onSent: callbacks?.onSent,
        onError: callbacks?.onError,
        onSuccess: () => {
          if (callbacks?.onSuccess) {
            callbacks.onSuccess(result);
          }
        },
      },
    });

    return result;
  } catch (error) {
    console.error("Error adding passkey to Safe:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
}

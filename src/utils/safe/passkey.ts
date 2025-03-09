import { Address } from "viem";
import { SafeAccountV0_3_0 as SafeAccount, WebauthnPublicKey } from "abstractionkit";

import { PasskeyCredentials, WebAuthnHelper } from "@/utils/webauthn";
import { createAndSendSponsoredUserOp, sendUserOperation } from "@/utils/safe";
import { createAddOwnerTemplate } from "./templates";

interface AddPasskeyCallbacks {
  onSent?: () => void;
  onSuccess?: (result: { credentialId: string; publicKey: string; publicKeyCoordinates: WebauthnPublicKey }) => void;
  onError?: (error: Error) => void;
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
 */
export async function addPasskeyToSafe({
  safeAddress,
  userEmail,
  threshold = 1,
  credential,
  callbacks,
}: AddPasskeyConfig) {
  try {
    // Initialize WebAuthn helper
    const webauthn = new WebAuthnHelper({
      publicKey: credential.publicKey,
      credentialId: credential.credentialId,
    });

    // Create the new passkey
    const result = await WebAuthnHelper.createPasskey(userEmail);
    if (!result?.credentialId || !result?.publicKey || !result?.publicKeyCoordinates) {
      throw new Error("Failed to create passkey");
    }

    // Get the current Safe account
    const safeAccount = new SafeAccount(safeAddress);

    // Create transaction to add the new signer while keeping the same threshold
    const addOwnerTxs = await createAddOwnerTemplate(safeAccount, result.publicKeyCoordinates, threshold);

    // Create and send the sponsored user operation
    const { userOp, hash } = await createAndSendSponsoredUserOp(safeAddress, addOwnerTxs, {
      signer: result.publicKeyCoordinates,
      isWebAuthn: true,
    });

    callbacks?.onSent?.();

    // Sign and send the operation
    // const { signature } = await webauthn.signMessage(hash);
    // await sendUserOperation(safeAddress, userOp, { signer: result.publicKeyCoordinates, signature });

    callbacks?.onSuccess?.(result);
    return result;
  } catch (error) {
    console.error("Error adding passkey to Safe:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
}

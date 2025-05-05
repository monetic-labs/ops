import type { SignMetadata } from "ox/WebAuthnP256";

import { Bytes, Hex as OxHex, PublicKey, type Signature } from "ox";
import { createCredential, sign } from "ox/WebAuthnP256";
import {
  type WebauthnPublicKey,
  type WebauthnSignatureData,
  type SignerSignaturePair,
  SafeAccountV0_3_0 as SafeAccount,
} from "abstractionkit";
import { Hex } from "viem";

import pylon from "@/libs/monetic-sdk";

const logPrefix = "[WebAuthn Helper]";

export interface PasskeyCredentials {
  publicKey: WebauthnPublicKey;
  credentialId: string;
}

export class WebAuthnHelper {
  private readonly publicKey: WebauthnPublicKey;
  private readonly credentialId: string;

  constructor({ publicKey, credentialId }: PasskeyCredentials) {
    this.publicKey = publicKey;
    this.credentialId = credentialId;
  }

  /**
   * Get the public key of the passkey
   */
  get getPublicKey(): WebauthnPublicKey {
    return this.publicKey;
  }

  /**
   * Get the credential ID of the passkey
   */
  get getCredentialId(): string {
    return this.credentialId;
  }

  /**
   * Get both the public key and credential ID
   */
  getCredentials(): PasskeyCredentials {
    return {
      publicKey: this.publicKey,
      credentialId: this.credentialId,
    };
  }

  /**
   * Request a challenge from the server for registration
   * @returns The challenge string
   */
  private static async requestChallenge(): Promise<string> {
    console.info(`${logPrefix} Requesting challenge from server.`);
    const response = await pylon.generatePasskeyChallenge();
    console.info(`${logPrefix} Received challenge: ${response.challenge}`);
    return response.challenge;
  }

  /**
   * Verifies the rpIdHash in authenticatorData against the expected RP ID.
   * MUST be called client-side.
   * @param authenticatorData - The ArrayBuffer from the authenticator response.
   * @param expectedRpId - The RP ID string passed in the creation options.
   * @returns Promise<boolean> - True if the hash matches, false otherwise.
   */
  static async verifyRpIdHash(authenticatorData: ArrayBuffer, expectedRpId: string): Promise<boolean> {
    if (authenticatorData.byteLength < 32) {
      console.error("[WebAuthn Helper] AuthenticatorData is too short to contain rpIdHash.");
      return false;
    }
    // Extract the first 32 bytes (rpIdHash)
    const receivedRpIdHash = authenticatorData.slice(0, 32);

    try {
      // Calculate the SHA-256 hash of the expected RP ID string
      const expectedRpIdHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(expectedRpId));

      // Compare the received hash with the calculated hash
      const match = WebAuthnHelper.compareArrayBuffers(receivedRpIdHash, expectedRpIdHash);

      if (!match) {
        console.warn(`[WebAuthn Helper] CLIENT-SIDE RP ID HASH MISMATCH DETECTED!`);
        console.warn(`> Expected RP ID: ${expectedRpId}`);
        // Optionally log the hex values for debugging
        // console.warn(`> Expected Hash: ${Buffer.from(expectedRpIdHash).toString('hex')}`);
        // console.warn(`> Received Hash: ${Buffer.from(receivedRpIdHash).toString('hex')}`);
      } else {
        console.info(`[WebAuthn Helper] Client-side rpIdHash verification successful for RP ID: ${expectedRpId}`);
      }
      return match;
    } catch (error) {
      console.error("[WebAuthn Helper] Error during client-side rpIdHash verification:", error);
      return false; // Treat calculation errors as verification failure
    }
  }

  /**
   * Creates a new WebAuthn credential using server-provided options
   * @param email User's email for registration
   * @returns WebauthnPublicKey for use with Safe
   */
  static async createPasskey(email: string): Promise<{
    credentialId: string;
    publicKey: Hex;
    publicKeyCoordinates: WebauthnPublicKey;
    passkeyId: string;
  }> {
    console.info(`${logPrefix} Starting 'createPasskey' for email: ${email}`);
    try {
      console.info(`${logPrefix} Getting registration options...`);
      const rawOptions = await pylon.getPasskeyRegistrationOptions(email);

      if (!rawOptions || !rawOptions.rp || !rawOptions.rp.id) {
        // Ensure rp.id exists
        throw new Error("Failed to get valid registration options with RP ID from server");
      }

      // --- Store the expected RP ID ---
      const expectedRpId = rawOptions.rp.id;
      console.info(`${logPrefix} Expected RP ID for creation: ${expectedRpId}`);

      // Create credential with server-provided options
      const credential = await createCredential({
        ...rawOptions,
        challenge: Bytes.fromString(rawOptions.challenge),
        user: {
          ...rawOptions.user,
          id: Bytes.fromString(rawOptions.user.id),
        },
        ...(rawOptions.excludeCredentials && {
          excludeCredentials: rawOptions.excludeCredentials.map((credentialId) => ({
            id: Bytes.fromString(credentialId),
          })),
        }),
      });

      const rawCredential = credential.raw as PublicKeyCredential;
      const response = rawCredential.response as AuthenticatorAttestationResponse;
      const authenticatorData = response.getAuthenticatorData();

      const isRpIdHashValid = await WebAuthnHelper.verifyRpIdHash(authenticatorData, expectedRpId);

      if (!isRpIdHashValid) {
        // If the hash doesn't match on the client, registration will fail on the server.
        // Throw an error here to prevent sending invalid data.
        throw new Error("Client-side rpIdHash verification failed. Authenticator did not use the expected RP ID.");
      }

      // Extract transports from the raw credential
      const transports = response.getTransports();
      console.info(`${logPrefix} Credential created locally and rpIdHash verified. Registering with server...`, {
        credentialId: credential.id,
        transports,
      });

      const { x, y } = PublicKey.from(credential.publicKey);

      // Register passkey with server
      const { passkeyId } = await pylon.registerPasskey({
        credentialId: credential.id,
        challenge: rawOptions.challenge,
        publicKey: PublicKey.toHex(credential.publicKey),
        transports,
      });
      console.info(`${logPrefix} Server registration complete. Passkey DB ID: ${passkeyId}`);

      return {
        credentialId: credential.id,
        publicKey: PublicKey.toHex(credential.publicKey),
        publicKeyCoordinates: { x, y },
        passkeyId,
      };
    } catch (error) {
      console.error(`${logPrefix} 'createPasskey' failed:`, error);
      // Re-throw a more generic error or the specific one
      if (error instanceof Error) {
        throw new Error(`Failed to create passkey: ${error.message}`);
      } else {
        throw new Error("Failed to create passkey due to an unknown error.");
      }
    }
  }

  /**
   * Logs in with an existing passkey and returns a WebAuthnHelper instance
   * @param credentialIds - Array of credential IDs to use for authentication
   * @returns A new WebAuthnHelper instance with the credential that was used for authentication
   */
  static async login(credentialIds?: string[]): Promise<WebAuthnHelper> {
    console.info(`${logPrefix} Starting 'login' with credential IDs:`, credentialIds);
    try {
      const challengeStr = await this.requestChallenge();
      const challenge = Bytes.fromString(challengeStr);

      const {
        raw: credential,
        signature,
        metadata,
      } = await sign({
        challenge: OxHex.fromBytes(challenge),
        userVerification: "required" as const,
        ...(credentialIds && { credentialId: credentialIds }),
      });

      const serializedSignature = {
        r: signature.r.toString(),
        s: signature.s.toString(),
      };

      const { publicKey } = await pylon.authenticatePasskey({
        credentialId: credential.id,
        challenge: challengeStr,
        metadata, // Contains authenticatorData, clientDataJSON
        signature: serializedSignature,
      });
      console.info(`${logPrefix} Server authentication successful.`);

      const { x, y } = PublicKey.fromHex(publicKey as Hex);

      return new WebAuthnHelper({
        publicKey: { x, y },
        credentialId: credential.id,
      });
    } catch (error) {
      console.error(`${logPrefix} 'login' failed:`, error);
      throw new Error("Failed to authenticate with passkey");
    }
  }

  /**
   * Verifies that the user still has access to their passkey
   * @returns true if verification succeeds, throws error otherwise
   */
  async verify(): Promise<boolean> {
    try {
      const challenge = Bytes.fromString(`verify_${Date.now()}`);

      await sign({
        challenge: OxHex.fromBytes(challenge),
        credentialId: this.credentialId,
        userVerification: "required",
      });

      return true;
    } catch (error) {
      console.error("Error verifying passkey:", error);
      throw new Error("Failed to verify passkey access");
    }
  }

  /**
   * Signs a message using the stored credential
   * @param message - Message to sign (typically a userOpHash)
   * @returns SignerSignaturePair for use with Safe
   */
  async signMessage(
    message: Hex
  ): Promise<SignerSignaturePair & { rawSignature: Signature.Signature<false>; metadata: SignMetadata }> {
    // Get signature and WebAuthn data using ox
    const { signature, metadata } = await sign({
      challenge: message,
      credentialId: this.credentialId,
      userVerification: "required",
    });

    // Create WebAuthn signature data for Safe
    const webauthnSignatureData = this.createSafeWebAuthnSignatureData(metadata, signature);
    const webauthnSignature = SafeAccount.createWebAuthnSignature(webauthnSignatureData);

    return {
      signer: this.publicKey,
      signature: webauthnSignature,
      rawSignature: signature,
      metadata,
    };
  }

  /**
   * Creates WebAuthn signature data formatted for Safe contract verification
   */
  private createSafeWebAuthnSignatureData(
    metadata: SignMetadata,
    signature: Signature.Signature<false>
  ): WebauthnSignatureData {
    // Extract fields after the challenge from clientDataJSON using Safe's required format
    const match = metadata.clientDataJSON.match(/^\{"type":"webauthn.get","challenge":"[A-Za-z0-9\-_]{43}",(.*)\}$/);

    if (!match) {
      throw new Error("Invalid client data format: challenge not found");
    }
    const [, fields] = match;

    return {
      authenticatorData: Bytes.fromHex(metadata.authenticatorData).buffer as ArrayBuffer,
      clientDataFields: OxHex.fromString(fields),
      rs: [signature.r, signature.s],
    };
  }

  private static compareArrayBuffers(buf1: ArrayBuffer, buf2: ArrayBuffer): boolean {
    if (buf1.byteLength !== buf2.byteLength) return false;
    const view1 = new Uint8Array(buf1);
    const view2 = new Uint8Array(buf2);
    for (let i = 0; i < view1.length; i++) {
      if (view1[i] !== view2[i]) return false;
    }
    return true;
  }
}

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

import pylon from "@/libs/pylon-sdk";

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
    const response = await pylon.generatePasskeyChallenge();
    return response.challenge;
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
    try {
      const rawOptions = await pylon.getPasskeyRegistrationOptions(email);

      if (!rawOptions) {
        throw new Error("Failed to get registration options");
      }

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

      // Extract transports from the raw credential
      const rawCredential = credential.raw as PublicKeyCredential;
      const response = rawCredential.response as AuthenticatorAttestationResponse;
      const transports = response.getTransports();

      const { x, y } = PublicKey.from(credential.publicKey);

      // Register passkey with server
      const { passkeyId } = await pylon.registerPasskey({
        credentialId: credential.id,
        challenge: rawOptions.challenge,
        publicKey: PublicKey.toHex(credential.publicKey),
        transports,
      });

      return {
        credentialId: credential.id,
        publicKey: PublicKey.toHex(credential.publicKey),
        publicKeyCoordinates: { x, y },
        passkeyId,
      };
    } catch (error) {
      console.error("Passkey creation failed:", error);
      throw new Error("Failed to create passkey. Please try again.");
    }
  }

  /**
   * Logs in with an existing passkey and returns a WebAuthnHelper instance
   * @returns A new WebAuthnHelper instance if successful
   * @param credentialIds - The credential IDs to use for login
   */
  static async login(credentialIds?: string[]): Promise<WebAuthnHelper> {
    try {
      const challengeStr = await this.requestChallenge();
      const challenge = Bytes.fromString(challengeStr);

      const {
        raw: credential,
        signature,
        metadata,
      } = await sign({
        challenge: OxHex.fromBytes(challenge),
        userVerification: "required",
        ...(credentialIds && { credentialId: credentialIds[0] }),
      });

      const serializedSignature = {
        r: signature.r.toString(),
        s: signature.s.toString(),
      };

      const { publicKey } = await pylon.authenticatePasskey({
        credentialId: credential.id,
        challenge: challengeStr,
        metadata,
        signature: serializedSignature,
      });

      const { x, y } = PublicKey.fromHex(publicKey as Hex);

      return new WebAuthnHelper({
        publicKey: { x, y },
        credentialId: credential.id,
      });
    } catch (error) {
      console.error("Error logging in with passkey:", error);
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
}

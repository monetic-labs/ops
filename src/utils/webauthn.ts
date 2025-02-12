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

import { isLocal, isProduction, isStaging, todayStr } from "./helpers";

export class WebAuthnHelper {
  private static readonly appName = `Backpack${!isLocal ? "" : " Staging"}`;
  private static readonly hostName = WebAuthnHelper.getHostName();
  private publicKey: WebauthnPublicKey | null = null;
  private credentialId: string | null = null;

  constructor({ publicKey, credentialId }: { publicKey?: WebauthnPublicKey; credentialId?: string } = {}) {
    this.publicKey = publicKey || null;
    this.credentialId = credentialId || null;
  }

  /**
   * Request a challenge from the server for registration
   * @returns The challenge string
   */
  async requestChallenge(): Promise<string> {
    const response = await pylon.generatePasskeyChallenge();
    return response.challenge;
  }

  /**
   * Creates a new WebAuthn credential
   * @returns WebauthnPublicKey for use with Safe
   */
  async createPasskey(): Promise<{
    credentialId: string;
    publicKey: Hex;
    publicKeyCoordinates: WebauthnPublicKey;
    passkeyId: string;
  }> {
    const challengeStr = await this.requestChallenge();
    const challenge = Bytes.fromString(challengeStr);

    const credential = await createCredential({
      challenge,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      user: {
        id: Bytes.fromString(crypto.randomUUID()),
        name: `${WebAuthnHelper.appName} Key (${todayStr})`,
        displayName: `${WebAuthnHelper.appName} Key (${todayStr})`,
      },
      rp: {
        id: WebAuthnHelper.hostName,
        name: WebAuthnHelper.appName,
      },
      timeout: 8000, // 8 seconds
    });

    const { x, y } = PublicKey.from(credential.publicKey);

    this.publicKey = { x, y };
    this.credentialId = credential.id;

    // Register passkey to server
    const { passkeyId } = await pylon.registerPasskey({
      credentialId: credential.id,
      publicKey: PublicKey.toHex(credential.publicKey),
    });

    return {
      credentialId: credential.id,
      publicKey: PublicKey.toHex(credential.publicKey),
      publicKeyCoordinates: this.publicKey,
      passkeyId,
    };
  }

  /**
   * Logs in with an existing passkey
   * @returns The credential and public key if successful
   */
  async loginWithPasskey(): Promise<{ publicKey: WebauthnPublicKey; credentialId: string }> {
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

      this.publicKey = { x, y };
      this.credentialId = credential.id;

      return {
        publicKey: this.publicKey,
        credentialId: credential.id,
      };
    } catch (error) {
      console.error("Error logging in with passkey:", error);
      throw new Error("Failed to authenticate with passkey");
    }
  }

  /**
   * Verifies that the user still has access to their passkey
   * @returns true if verification succeeds, throws error otherwise
   */
  async verifyPasskey(): Promise<boolean> {
    if (!this.credentialId) {
      throw new Error("No credential available. Please create or use a passkey first.");
    }

    try {
      const challenge = Bytes.fromString(`verify_${Date.now()}`);
      const { signature, metadata } = await sign({
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
    if (!this.credentialId || !this.publicKey) {
      // Try to login with passkey if no credential is available
      await this.loginWithPasskey();

      if (!this.credentialId || !this.publicKey) {
        throw new Error("No credential available. Please create or use a passkey first.");
      }
    }

    // Get signature and WebAuthn data using ox
    const { signature, metadata } = await sign({
      challenge: message,
      credentialId: this.credentialId || undefined,
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

  private static getHostName(): string {
    if (isProduction) {
      return "backpack.network";
    } else if (isLocal) {
      return "localhost";
    } else if (isStaging) {
      return "staging.backpack.network";
    } else throw new Error("Invalid environment");
  }
}

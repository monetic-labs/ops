import type { P256Credential, SignMetadata } from "ox/WebAuthnP256";

import { Base64, Bytes, Hex as OxHex, PublicKey, type Signature } from "ox";
import { createChallenge, createCredential, CredentialCreationFailedError, sign } from "ox/WebAuthnP256";
import {
  type WebauthnPublicKey,
  type WebauthnSignatureData,
  type SignerSignaturePair,
  SafeAccountV0_3_0 as SafeAccount,
} from "abstractionkit";
import { Hex } from "viem";

import pylon from "@/libs/pylon-sdk";

import { isLocal } from "./helpers";

export class WebAuthnHelper {
  private credential: P256Credential | null = null;
  private webauthPublicKey: WebauthnPublicKey | null = null;
  private static appName = `Backpack${!isLocal ? "" : " Staging"}`;
  private hostName: string;

  constructor(hostName: string) {
    this.hostName = hostName;
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
    id: P256Credential["id"];
    publicKey: Hex;
    publicKeyCoordinates: WebauthnPublicKey;
    attestationObject: string;
    clientDataJSON: string;
    challenge: string;
    passkeyId: string;
  }> {
    // const passkey = await this.checkCredentialExists();
    // if (passkey) {
    //   throw Error("Passkey credential already exists.");
    // }

    const challengeStr = await this.requestChallenge();
    const challenge = Bytes.fromString(challengeStr);

    this.credential = await createCredential({
      name: WebAuthnHelper.appName,
      challenge,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      rp: {
        id: this.hostName,
        name: WebAuthnHelper.appName,
      },
      timeout: 8000, // 8 seconds
    });
    if (!this.credential) throw new CredentialCreationFailedError();

    const { x, y } = PublicKey.from(this.credential.publicKey);

    this.webauthPublicKey = { x, y };

    const response = this.credential.raw.response as AuthenticatorAttestationResponse;

    const { metadata, signature } = await sign({
      credentialId: this.credential.id,
      rpId: this.hostName,
      challenge: OxHex.fromBytes(challenge),
    });

    // Register passkey to server
    const { passkeyId } = await pylon.registerPasskey({
      credentialId: this.credential.id,
      publicKey: PublicKey.toHex(this.credential.publicKey),
      challenge: challengeStr,
      metadata,
      signature: {
        r: signature.r.toString(),
        s: signature.s.toString(),
      },
    });

    return {
      id: this.credential.id,
      publicKey: PublicKey.toHex(this.credential.publicKey),
      publicKeyCoordinates: this.webauthPublicKey,
      attestationObject: Base64.fromBytes(new Uint8Array(response.attestationObject)),
      clientDataJSON: Base64.fromString(new TextDecoder().decode(response.clientDataJSON)),
      challenge: challengeStr,
      passkeyId,
    };
  }

  /**
   * Logs in with an existing passkey
   * @returns The credential and public key if successful
   */
  async loginWithPasskey(): Promise<WebauthnPublicKey> {
    try {
      // Use ox's sign function which will prompt for an existing credential
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

      const credentialId = credential.id;
      const serializedSignature = {
        r: signature.r.toString(),
        s: signature.s.toString(),
      };

      const { user, token, publicKey } = await pylon.authenticatePasskey({
        credentialId,
        challenge: challengeStr,
        metadata,
        signature: serializedSignature,
      });

      const { x, y } = PublicKey.fromHex(publicKey as Hex);

      return { x, y };
    } catch (error) {
      console.error("Error logging in with passkey:", error);
      throw new Error("Failed to authenticate with passkey");
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
    if (!this.credential || !this.webauthPublicKey) {
      // Try to login with passkey if no credential is available
      await this.loginWithPasskey();

      if (!this.credential || !this.webauthPublicKey) {
        throw new Error("No credential available. Please create or use a passkey first.");
      }
    }

    // Get signature and WebAuthn data using ox
    const { signature, metadata } = await sign({
      challenge: message,
      credentialId: this.credential.id,
      userVerification: "required",
    });

    // Create WebAuthn signature data for Safe
    const webauthnSignatureData = this.createSafeWebAuthnSignatureData(metadata, signature);
    const webauthnSignature = SafeAccount.createWebAuthnSignature(webauthnSignatureData);

    return {
      signer: this.webauthPublicKey,
      signature: webauthnSignature,
      rawSignature: signature,
      metadata,
    };
  }

  /**
   * Creates WebAuthn signature data formatted for Safe contract verification
   * @param metadata - Metadata from ox's sign function
   * @param signature - Signature object from ox
   * @returns WebauthnSignatureData formatted for Safe
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

    // Create WebAuthn signature data with Safe's required format
    return {
      // Must use raw authenticator data from WebAuthn response for proper flag verification
      authenticatorData: Bytes.fromHex(metadata.authenticatorData).buffer as ArrayBuffer,
      // Extract and hex encode fields after challenge
      clientDataFields: OxHex.fromString(fields),
      // Use signature values directly from ox
      rs: [signature.r, signature.s],
    };
  }

  private async checkCredentialExists() {
    // TODO: check passkeyId with pylon
    return await sign({
      challenge: OxHex.fromBytes(createChallenge),
      userVerification: "required",
    });
  }
}

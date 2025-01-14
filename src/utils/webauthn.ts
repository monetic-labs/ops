import { Base64, Bytes, Hex as OxHex, PublicKey } from "ox";
import { createChallenge, createCredential, CredentialCreationFailedError, sign, verify } from "ox/WebAuthnP256";
import type { P256Credential, SignMetadata } from "ox/WebAuthnP256";
import {
  type WebauthnPublicKey,
  type WebauthnSignatureData,
  type SignerSignaturePair,
  SafeAccountV0_3_0 as SafeAccount,
} from "abstractionkit";
import { Hex } from "viem";

interface SignatureType {
  r: bigint;
  s: bigint;
}

export class WebAuthnHelper {
  private credential: P256Credential | null = null;
  private webauthPublicKey: WebauthnPublicKey | null = null;

  /**
   * Creates a new WebAuthn credential
   * @param name - Name for the credential
   * @param hostname - Hostname for the Relying Party ID
   * @returns WebauthnPublicKey for use with Safe
   */
  async createPasskey(
    name: string,
    hostname: string
  ): Promise<{
    id: P256Credential["id"];
    publicKey: Hex;
    publicKeyCoordinates: WebauthnPublicKey;
    attestationObject: string;
    clientDataJSON: string;
  }> {
    this.credential = await createCredential({
      name,
      challenge: createChallenge, // TODO: get challenge from server
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        userVerification: "required",
      },
      rp: {
        id: hostname,
        name,
      },
    });
    if (!this.credential) throw new CredentialCreationFailedError();

    const { x, y } = PublicKey.from(this.credential.publicKey);
    this.webauthPublicKey = { x, y };

    const response = this.credential.raw.response as AuthenticatorAttestationResponse;

    /**
     * in the schema, a certain unique passkey should be associated with a certain user id
     * such that, only that passkey can be used to sign for that user id
     */

    return {
      id: this.credential.id,
      publicKey: PublicKey.toHex(this.credential.publicKey),
      publicKeyCoordinates: this.webauthPublicKey,
      attestationObject: Base64.fromBytes(new Uint8Array(response.attestationObject)),
      clientDataJSON: Base64.fromString(new TextDecoder().decode(response.clientDataJSON)),
    };
  }

  /**
   * Signs a message using the stored credential
   * @param message - Message to sign (typically a userOpHash)
   * @returns SignerSignaturePair for use with Safe
   */
  async signMessage(message: string): Promise<SignerSignaturePair> {
    if (!this.credential || !this.webauthPublicKey) {
      throw new Error("No credential available. Call createPasskey first.");
    }

    // Get signature and WebAuthn data using ox
    const { signature, metadata } = await sign({
      challenge: message as `0x${string}`,
      credentialId: this.credential.id,
      userVerification: "required",
    });

    // Create WebAuthn signature data for Safe
    const webauthnSignatureData = this.createSafeWebAuthnSignatureData(metadata, signature);
    const webauthnSignature = SafeAccount.createWebAuthnSignature(webauthnSignatureData);

    return {
      signer: this.webauthPublicKey,
      signature: webauthnSignature,
    };
  }

  /**
   * Creates WebAuthn signature data formatted for Safe contract verification
   * @param metadata - Metadata from ox's sign function
   * @param signature - Signature object from ox
   * @returns WebauthnSignatureData formatted for Safe
   */
  private createSafeWebAuthnSignatureData(metadata: SignMetadata, signature: SignatureType): WebauthnSignatureData {
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
}

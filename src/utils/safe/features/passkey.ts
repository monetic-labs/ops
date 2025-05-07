import { Address, Hex } from "viem";
import {
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  SafeAccountV0_3_0 as SafeAccount,
  WebauthnPublicKey,
} from "abstractionkit";

import { PasskeyCredentials, WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";
import { SAFE_ABI } from "@/utils/abi/safe";

import { publicClient } from "@/config/web3";
import { PublicKey } from "ox";
import pylon from "@/libs/monetic-sdk";

const logPrefix = "[Passkey Sync]";

// Define passkey sync status for UI display
export enum PasskeyStatus {
  ACTIVE_ONCHAIN = "ACTIVE_ONCHAIN", // Registered on-chain and off-chain
  PENDING_ONCHAIN = "PENDING_ONCHAIN", // Registered off-chain but not on-chain yet
  UNKNOWN = "UNKNOWN", // Status couldn't be determined
}

// The authoritative Passkey type
export type Passkey = {
  id: string; // Non-optional: assume passkeys from DB will have this
  credentialId: string;
  publicKey: string; // Hex string representation
  displayName: string;
  lastUsedAt: string; // ISO Date string
  status: PasskeyStatus;
  rpId: string; // Non-optional
  createdAt?: string; // ISO Date string
  counter?: number;
  ownerAddress?: Address; // Hex address from viem
};

/**
 * Creates a new passkey and returns the credentials
 *
 * @param email User's email for passkey creation
 * @returns WebAuthn credentials for the new passkey
 */
export async function createPasskeyCredentials(email: string): Promise<WebAuthnCredentials> {
  const passkeyResult = await WebAuthnHelper.createPasskey(email);

  if (
    !passkeyResult?.credentialId ||
    !passkeyResult?.publicKey ||
    !passkeyResult?.publicKeyCoordinates ||
    !passkeyResult.rpId
  ) {
    throw new Error(
      "Failed to create passkey, missing required fields from WebAuthnHelper.createPasskey (including rpId)"
    );
  }

  return {
    credentialId: passkeyResult.credentialId,
    publicKey: passkeyResult.publicKeyCoordinates,
    rpId: passkeyResult.rpId,
  };
}

// Interface for the raw passkey data expected from the backend (e.g., via pylon.getUserById())
interface RegisteredPasskeyInput {
  id: string; // Expect 'id' from backend
  credentialId: string;
  publicKey?: string; // Optional as it might be enriched or processed
  displayName?: string;
  lastUsedAt?: string;
  createdAt?: string;
  rpId: string; // Expect 'rpId' from backend
  // counter is not part of this raw input, it's derived or less common
}

/**
 * Synchronizes on-chain and off-chain passkeys by comparing registered passkeys
 * with on-chain owners, and returns the status of each passkey
 *
 * @param walletAddress - The user's Safe wallet address
 * @param registeredPasskeysFromDb - The passkeys registered in the database
 * @returns Array of passkeys with their synchronization status
 */
export async function syncPasskeysWithSafe(
  walletAddress: Address | undefined,
  registeredPasskeysFromDb: Array<RegisteredPasskeyInput> = []
): Promise<Passkey[]> {
  console.info(`${logPrefix} Starting sync. Wallet: ${walletAddress}, Input Passkeys:`, registeredPasskeysFromDb);

  if (!walletAddress || !registeredPasskeysFromDb?.length) {
    console.info(`${logPrefix} No wallet or passkeys provided, mapping input to Passkey with UNKNOWN status.`);
    return (registeredPasskeysFromDb || []).map((passkey) => ({
      id: passkey.id,
      credentialId: passkey.credentialId,
      publicKey: passkey.publicKey || "",
      displayName: passkey.displayName || "Unnamed Device",
      status: PasskeyStatus.UNKNOWN,
      lastUsedAt: passkey.lastUsedAt || passkey.createdAt || new Date().toISOString(),
      rpId: passkey.rpId,
      createdAt: passkey.createdAt,
    }));
  }

  try {
    console.info(`${logPrefix} Fetching on-chain owners for ${walletAddress}`);
    const owners = (await publicClient.readContract({
      address: walletAddress,
      abi: SAFE_ABI,
      functionName: "getOwners",
    })) as Address[];

    const passkeysWithStatus: Passkey[] = await Promise.all(
      registeredPasskeysFromDb.map(async (passkeyInput): Promise<Passkey> => {
        if (!passkeyInput.publicKey) {
          console.warn(
            `${logPrefix} Passkey (ID: ${passkeyInput.id}, CredID: ${passkeyInput.credentialId}) missing publicKey. Status set to UNKNOWN.`
          );
          return {
            id: passkeyInput.id,
            credentialId: passkeyInput.credentialId,
            publicKey: "",
            displayName: passkeyInput.displayName || "Unnamed Device",
            status: PasskeyStatus.UNKNOWN,
            lastUsedAt: passkeyInput.lastUsedAt || passkeyInput.createdAt || new Date().toISOString(),
            rpId: passkeyInput.rpId,
            createdAt: passkeyInput.createdAt,
          };
        }

        try {
          let publicKeyHex = passkeyInput.publicKey;
          if (publicKeyHex.startsWith("{") && publicKeyHex.includes("x") && publicKeyHex.includes("y")) {
            const parsed = JSON.parse(publicKeyHex);
            if (parsed.x && parsed.y) {
              publicKeyHex = PublicKey.toHex({ x: BigInt(parsed.x), y: BigInt(parsed.y), prefix: 4 });
            }
          }
          if (!publicKeyHex.startsWith("0x")) {
            publicKeyHex = `0x${publicKeyHex}`;
          }

          const { x, y } = PublicKey.fromHex(publicKeyHex as Hex);
          const ownerAddress = SafeAccount.createWebAuthnSignerVerifierAddress(x, y, {
            eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
          }) as Address;

          const isOnChain = owners.some((owner) => owner.toLowerCase() === ownerAddress.toLowerCase());

          return {
            id: passkeyInput.id,
            credentialId: passkeyInput.credentialId,
            publicKey: publicKeyHex,
            displayName: passkeyInput.displayName || "Unnamed Device",
            status: isOnChain ? PasskeyStatus.ACTIVE_ONCHAIN : PasskeyStatus.PENDING_ONCHAIN,
            ownerAddress,
            lastUsedAt: passkeyInput.lastUsedAt || passkeyInput.createdAt || new Date().toISOString(),
            rpId: passkeyInput.rpId,
            createdAt: passkeyInput.createdAt,
          };
        } catch (error) {
          console.error(
            `${logPrefix} Error processing passkey (ID: ${passkeyInput.id}, CredID: ${passkeyInput.credentialId}):`,
            error
          );
          return {
            id: passkeyInput.id,
            credentialId: passkeyInput.credentialId,
            publicKey: passkeyInput.publicKey || "",
            displayName: passkeyInput.displayName || "Unnamed Device",
            status: PasskeyStatus.UNKNOWN,
            lastUsedAt: passkeyInput.lastUsedAt || passkeyInput.createdAt || new Date().toISOString(),
            rpId: passkeyInput.rpId,
            createdAt: passkeyInput.createdAt,
          };
        }
      })
    );

    console.info(`${logPrefix} Sync completed. Synced Passkeys:`, passkeysWithStatus);
    return passkeysWithStatus;
  } catch (error) {
    console.error(`${logPrefix} Error during sync:`, error);
    return (registeredPasskeysFromDb || []).map((passkey) => ({
      id: passkey.id,
      credentialId: passkey.credentialId,
      publicKey: passkey.publicKey || "",
      displayName: passkey.displayName || "Unnamed Device",
      status: PasskeyStatus.UNKNOWN,
      lastUsedAt: passkey.lastUsedAt || passkey.createdAt || new Date().toISOString(),
      rpId: passkey.rpId,
      createdAt: passkey.createdAt,
    }));
  }
}

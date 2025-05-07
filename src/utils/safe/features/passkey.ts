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

export type Passkey = {
  credentialId: string;
  publicKey: string;
  displayName: string;
  lastUsedAt: string;
  status: PasskeyStatus;
  id?: string;
  rpId?: string;
  createdAt?: string;
  counter?: number;
  ownerAddress?: Address;
};

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
    rpId: passkeyResult.rpId,
  };
}

/**
 * Synchronizes on-chain and off-chain passkeys by comparing registered passkeys
 * with on-chain owners, and returns the status of each passkey
 *
 * @param walletAddress - The user's Safe wallet address
 * @param registeredPasskeys - The passkeys registered in the database
 * @returns Array of passkeys with their synchronization status
 */
export async function syncPasskeysWithSafe(
  walletAddress: Address | undefined,
  registeredPasskeys: Array<{
    credentialId: string;
    publicKey?: string;
    displayName?: string;
    lastUsedAt?: string;
    id?: string;
    createdAt?: string;
  }> = []
): Promise<Passkey[]> {
  console.info(`${logPrefix} Starting sync. Wallet: ${walletAddress}, Input Passkeys:`, registeredPasskeys);
  // If no wallet address or no passkeys, return empty array
  if (!walletAddress || !registeredPasskeys?.length) {
    console.info(`${logPrefix} No wallet or passkeys provided, returning basic mapping.`);
    return (registeredPasskeys || []).map((passkey) => ({
      ...passkey,
      displayName: passkey?.displayName || "Unnamed Device",
      status: PasskeyStatus.UNKNOWN,
      lastUsedAt: passkey?.lastUsedAt || passkey?.createdAt || new Date().toISOString(),
      publicKey: passkey?.publicKey || "",
    }));
  }

  try {
    // Get on-chain owners
    console.info(`${logPrefix} Fetching on-chain owners for ${walletAddress}`);
    const owners = (await publicClient.readContract({
      address: walletAddress,
      abi: SAFE_ABI,
      functionName: "getOwners",
    })) as Address[];

    // Try to get the latest user data from pylon to get all passkeys with public keys
    let completePasskeys = registeredPasskeys;
    try {
      const userData = await pylon.getUserById();
      if (userData?.registeredPasskeys?.length > 0) {
        // Create a map of the complete passkeys from the API
        const completePasskeysMap = userData.registeredPasskeys.reduce(
          (acc, pk) => {
            if (pk.credentialId && pk.publicKey) {
              acc[pk.credentialId] = pk;
            }
            return acc;
          },
          {} as Record<string, any>
        );

        // Enrich our input passkeys with data from the API
        completePasskeys = registeredPasskeys.map((pk) => {
          const complete = completePasskeysMap[pk.credentialId];
          if (complete && complete.publicKey && !pk.publicKey) {
            return {
              ...pk,
              publicKey: complete.publicKey,
            };
          }
          return pk;
        });
      }
    } catch (error) {
      console.warn("Could not fetch updated user data from pylon:", error);
      // Continue with the original passkeys
    }

    // Convert each registered passkey to its corresponding on-chain address
    const passkeysWithStatus = await Promise.all(
      completePasskeys.map(async (passkey) => {
        if (!passkey || !passkey.credentialId) {
          // Handle invalid passkey data
          console.error("Invalid passkey data (missing credentialId):", passkey);
          return {
            id: passkey?.id,
            credentialId: passkey?.credentialId || "unknown",
            publicKey: passkey?.publicKey || "",
            displayName: passkey?.displayName || "Unnamed Device",
            status: PasskeyStatus.UNKNOWN,
            lastUsedAt: passkey?.lastUsedAt || passkey?.createdAt || new Date().toISOString(),
          };
        }

        try {
          // If publicKey is missing, we need to handle the error properly, not hardcode
          if (!passkey.publicKey) {
            return {
              id: passkey?.id,
              credentialId: passkey.credentialId,
              publicKey: "",
              displayName: passkey.displayName || "Unnamed Device",
              status: PasskeyStatus.UNKNOWN,
              lastUsedAt: passkey.lastUsedAt || passkey.createdAt || new Date().toISOString(),
            };
          }

          // Handle JSON string public keys (they might have been stringified)
          let publicKeyHex = passkey.publicKey;
          try {
            // If it's a stringified JSON object, parse it and extract the coordinates
            if (publicKeyHex.startsWith("{") && publicKeyHex.includes("x") && publicKeyHex.includes("y")) {
              const parsed = JSON.parse(publicKeyHex);
              if (parsed.x && parsed.y) {
                // Use the recommended method for converting
                publicKeyHex = PublicKey.toHex({ ...parsed, prefix: 4 });
              }
            }

            // Make sure it's a valid hex string
            if (!publicKeyHex.startsWith("0x")) {
              publicKeyHex = `0x${publicKeyHex}`;
            }
          } catch (e) {
            // Continue with original publicKey if parsing fails
          }

          // Convert the passkey's public key to an on-chain owner address
          const { x, y } = PublicKey.fromHex(publicKeyHex as Hex);

          // Create the owner address using Candide's function
          const ownerAddress = SafeAccount.createWebAuthnSignerVerifierAddress(x, y, {
            eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
          }) as Address;

          // Check if this owner exists on-chain
          const isOnChain = owners.some((owner) => owner.toLowerCase() === ownerAddress.toLowerCase());

          return {
            id: passkey.id,
            credentialId: passkey.credentialId,
            publicKey: publicKeyHex,
            displayName: passkey.displayName || "Unnamed Device",
            status: isOnChain ? PasskeyStatus.ACTIVE_ONCHAIN : PasskeyStatus.PENDING_ONCHAIN,
            ownerAddress,
            lastUsedAt: passkey.lastUsedAt || passkey.createdAt || new Date().toISOString(),
          };
        } catch (error) {
          console.error("Error processing passkey:", error);
          return {
            id: passkey.id,
            credentialId: passkey.credentialId,
            publicKey: passkey.publicKey || "",
            displayName: passkey.displayName || "Unnamed Device",
            status: PasskeyStatus.UNKNOWN,
            lastUsedAt: passkey.lastUsedAt || passkey.createdAt || new Date().toISOString(),
          };
        }
      })
    );

    console.info(`${logPrefix} Sync completed. Synced Passkeys:`, passkeysWithStatus);
    return passkeysWithStatus;
  } catch (error) {
    console.error(`${logPrefix} Error during sync:`, error);
    // Return passkeys with unknown status in case of error
    return (registeredPasskeys || []).map((passkey) => ({
      ...passkey,
      displayName: passkey?.displayName || "Unnamed Device",
      publicKey: passkey?.publicKey || "",
      status: PasskeyStatus.UNKNOWN,
      lastUsedAt: passkey?.lastUsedAt || passkey?.createdAt || new Date().toISOString(),
    }));
  }
}

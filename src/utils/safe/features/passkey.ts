import { Address, Hex } from "viem";
import {
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  SafeAccountV0_3_0 as SafeAccount,
  WebauthnPublicKey,
} from "abstractionkit";

import { PasskeyCredentials, WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";
import { SAFE_ABI } from "@/utils/abi/safe";

import { createAddOwnerTemplate } from "../templates";
import { executeDirectTransaction } from "../flows/direct";
import { publicClient } from "@/config/web3";
import { PublicKey } from "ox";
import pylon from "@/libs/pylon-sdk";

// Define passkey sync status for UI display
export enum PasskeyStatus {
  ACTIVE_ONCHAIN = "ACTIVE_ONCHAIN", // Registered on-chain and off-chain
  PENDING_ONCHAIN = "PENDING_ONCHAIN", // Registered off-chain but not on-chain yet
  UNKNOWN = "UNKNOWN", // Status couldn't be determined
}

export interface PasskeyWithStatus {
  credentialId: string;
  publicKey: string;
  displayName: string;
  status: PasskeyStatus;
  ownerAddress?: Address;
  lastUsedAt: string;
}

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
    publicKey?: string; // Make this optional since it might be missing
    displayName?: string;
    lastUsedAt?: string; // Make this optional too
    id?: string; // Add id field from your database
    createdAt?: string; // Add createdAt field from your database
  }> = []
): Promise<PasskeyWithStatus[]> {
  // If no wallet address or no passkeys, return empty array
  if (!walletAddress || !registeredPasskeys?.length) {
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
            credentialId: passkey.credentialId,
            publicKey: passkey.publicKey || "",
            displayName: passkey.displayName || "Unnamed Device",
            status: PasskeyStatus.UNKNOWN,
            lastUsedAt: passkey.lastUsedAt || passkey.createdAt || new Date().toISOString(),
          };
        }
      })
    );

    return passkeysWithStatus;
  } catch (error) {
    console.error("Error syncing passkeys with Safe:", error);
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

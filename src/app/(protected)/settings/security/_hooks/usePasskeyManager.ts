import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/generics/useToast";
import pylon from "@/libs/monetic-sdk";
import { WebAuthnHelper } from "@/utils/webauthn";
import { isAxiosError } from "axios";
import { MerchantUserGetByIdOutput } from "@monetic-labs/sdk";

import { PasskeyStatus, syncPasskeysWithSafe, PasskeyWithStatus } from "@/utils/safe/features/passkey";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";
import { executeDirectTransaction } from "@/utils/safe/flows/direct";
import { createAddOwnerTemplate, createRemoveOwnerTemplate } from "@/utils/safe/templates";
import { SafeAccountV0_3_0 as SafeAccount } from "abstractionkit";
import { Address, Hex } from "viem";
import { PublicKey } from "ox";
import { publicClient } from "@/config/web3";
import { SAFE_ABI } from "@/utils/abi/safe";
import { deployIndividualSafe } from "@/utils/safe/features/deploy";
import { useUser } from "@/contexts/UserContext";

const logPrefix = "[Passkey Manager]";

interface UsePasskeyManagerProps {
  user: MerchantUserGetByIdOutput | undefined;
}

export function usePasskeyManager({ user }: UsePasskeyManagerProps) {
  // State now holds PasskeyWithStatus
  const [passkeys, setPasskeys] = useState<PasskeyWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({}); // Track processing state per passkey

  const { toast } = useToast();
  const { selectCredential } = usePasskeySelection(); // Needed for signing transactions
  const { forceAuthCheck } = useUser(); // Get function to refresh user context data

  const fetchPasskeys = useCallback(
    async (showLoading = true) => {
      if (!user?.id) {
        // Check for user ID
        setPasskeys([]);
        setIsLoading(false);
        return;
      }
      console.info(`${logPrefix} Fetching passkeys for user: ${user.id}`);
      if (showLoading) {
        setIsLoading(true);
      }
      try {
        // Fetch raw passkeys first
        const userData = await pylon.getUserById(); // Assuming this returns the user with registeredPasskeys
        const rawPasskeys = userData?.registeredPasskeys || [];

        // Get status by syncing with Safe
        const syncedPasskeys = await syncPasskeysWithSafe(
          user.walletAddress as Address | undefined, // Wallet address might be undefined initially
          rawPasskeys
        );
        setPasskeys(syncedPasskeys);
      } catch (error) {
        console.error(`${logPrefix} Error fetching/syncing passkeys:`, error);
        toast({ title: "Error", description: "Failed to load passkey status.", variant: "destructive" });
        setPasskeys([]); // Or display raw passkeys with UNKNOWN status
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [user?.id, user?.walletAddress, toast] // Depend on user ID and walletAddress
  );

  const addPasskey = useCallback(async () => {
    console.info(`${logPrefix} Starting 'addPasskey' for user: ${user?.id}`);
    if (!user?.email || !user?.id) {
      toast({ title: "Error", description: "User information is missing.", variant: "destructive" });
      return;
    }

    setIsAdding(true);

    try {
      // --- SCENARIO 1: First Passkey - Deploy Account ---
      if (!user.walletAddress) {
        console.info(`${logPrefix} Scenario: First passkey, deploying account.`);
        toast({
          title: "Creating Account...",
          description: "Setting up your secure account and first passkey.",
          variant: "default",
        });

        // Validate phone if required for deployment flow
        if (!user.phone) {
          // Add more robust validation if needed
          throw new Error("A valid phone number is required to create the account.");
        }

        // Call the deployment function
        const { address: newWalletAddress } = await deployIndividualSafe({
          email: user.email,
          phone: user.phone, // Pass phone number
          callbacks: {
            // Optional callbacks for progress toasts
            onPasskeyCreated: () =>
              toast({ title: "Passkey Created", description: "Secure key generated.", variant: "default" }),
            onDeployment: () =>
              toast({
                title: "Deploying Account...",
                description: "Creating your secure wallet on-chain.",
                variant: "default",
              }),
            onRecoverySetup: () =>
              toast({
                title: "Setting Up Recovery...",
                description: "Configuring backup options.",
                variant: "default",
              }),
            onError: (e) => console.error("Deployment callback error:", e), // Log errors from callbacks
          },
        });

        toast({
          title: "Account Created!",
          description: "Updating your profile with the new wallet address.",
          variant: "default",
        });

        // Update user in backend with the new wallet address
        // (Rely on forceAuthCheck instead of manual pylon call if UserContext handles this)
        // await pylon.updateUser(user.id, { walletAddress: newWalletAddress });
        // Assuming 'pylon' is your initialized API client
        await pylon.updateUser(user.id, { walletAddress: newWalletAddress });

        // Force refresh of user context data, which should include the new walletAddress and passkey
        await forceAuthCheck();
        // Fetch passkeys again after user context is updated
        await fetchPasskeys(false);

        toast({
          title: "Setup Complete!",
          description: "Your account and first passkey are ready.",
          variant: "default",
        });
      }
      // --- SCENARIO 2: Add Subsequent Passkey (Off-chain only) ---
      else {
        console.info(`${logPrefix} Scenario: Adding subsequent passkey (off-chain).`);
        toast({
          title: "Registering Passkey...",
          description: "Please follow the browser prompts.",
          variant: "default",
        });
        // Just register the passkey with the backend via WebAuthnHelper
        await WebAuthnHelper.createPasskey(user.email);
        toast({
          title: "Passkey Registered!",
          description: "Activate the new passkey to use it on-chain.",
          variant: "default",
        });
        // Refresh list to show the new pending passkey
        await fetchPasskeys(false);
      }
      console.info(`${logPrefix} 'addPasskey' completed successfully.`);
    } catch (error: any) {
      console.error(`${logPrefix} Error during 'addPasskey':`, error);
      // Handle potential DOMExceptions from WebAuthn cancellation
      if (error instanceof DOMException) {
        toast({
          title: "Cancelled",
          description: `Passkey creation was cancelled: ${error.message}`,
          variant: "default",
        });
      } else {
        const errorMessage = isAxiosError(error)
          ? error.response?.data?.message
          : error.message || "An unknown error occurred.";
        toast({ title: "Operation Failed", description: errorMessage, variant: "destructive" });
      }
    } finally {
      setIsAdding(false); // Clear loading state
    }
  }, [user, toast, fetchPasskeys, forceAuthCheck]); // Add forceAuthCheck to dependencies

  // Activate a pending passkey on-chain
  const activatePasskey = useCallback(
    async (passkey: PasskeyWithStatus) => {
      console.info(`${logPrefix} Starting 'activatePasskey' for credential: ${passkey.credentialId}`);
      if (passkey.status !== PasskeyStatus.PENDING_ONCHAIN || !user?.walletAddress || !passkey.publicKey) {
        toast({ title: "Error", description: "Passkey cannot be activated.", variant: "destructive" });
        return;
      }

      const processId = passkey.id || passkey.credentialId; // Use DB id if available
      setIsProcessing((prev) => ({ ...prev, [processId]: true }));
      try {
        // Need an existing credential to sign the activation transaction
        const signingCredential = await selectCredential();

        toast({
          title: "Activating...",
          description: "Adding passkey to your Safe account. Please authorize.",
          variant: "default",
        });

        const { x, y } = PublicKey.fromHex(passkey.publicKey as Hex);
        const safeAccount = new SafeAccount(user.walletAddress as Address);
        const addOwnerTxs = await createAddOwnerTemplate(safeAccount, { x, y }, 1); // Assuming threshold 1 for now

        await executeDirectTransaction({
          safeAddress: user.walletAddress as Address,
          transactions: addOwnerTxs,
          credentials: signingCredential,
          callbacks: {
            onSuccess: () => {
              toast({ title: "Activated!", description: "Passkey successfully added on-chain.", variant: "default" });
              fetchPasskeys(false); // Refresh status
            },
            onError: (error: Error) => {
              toast({ title: "Activation Failed", description: error.message, variant: "destructive" });
            },
          },
        });
        console.info(`${logPrefix} 'activatePasskey' completed successfully for credential: ${passkey.credentialId}.`);
      } catch (error: any) {
        console.error(`${logPrefix} Error during 'activatePasskey' for credential ${passkey.credentialId}:`, error);
        const errorMessage = error.message || "Could not activate passkey.";
        toast({ title: "Activation Error", description: errorMessage, variant: "destructive" });
      } finally {
        setIsProcessing((prev) => ({ ...prev, [processId]: false }));
      }
    },
    [user?.walletAddress, selectCredential, toast, fetchPasskeys]
  );

  // Rename a passkey (off-chain)
  const renamePasskey = useCallback(
    async (passkeyId: string, newDisplayName: string) => {
      console.info(`${logPrefix} Starting 'renamePasskey' for ID: ${passkeyId} to name: ${newDisplayName}`);
      if (!passkeyId || !newDisplayName) return;

      setIsProcessing((prev) => ({ ...prev, [passkeyId]: true })); // Use passkeyId (DB id) for rename processing state
      try {
        await pylon.updatePasskeyDisplayName(passkeyId, { displayName: newDisplayName });
        toast({ title: "Renamed", description: "Passkey name updated.", variant: "default" });
        // Optimistic UI update might be better, but refetch is simpler for now
        await fetchPasskeys(false);
        console.info(`${logPrefix} 'renamePasskey' completed successfully for ID: ${passkeyId}.`);
      } catch (error: any) {
        console.error(`${logPrefix} Error during 'renamePasskey' for ID ${passkeyId}:`, error);
        const errorMessage = isAxiosError(error)
          ? error.response?.data?.message
          : error.message || "Failed to rename passkey.";
        toast({ title: "Rename Failed", description: errorMessage, variant: "destructive" });
      } finally {
        setIsProcessing((prev) => ({ ...prev, [passkeyId]: false }));
      }
    },
    [toast, fetchPasskeys]
  );

  // Placeholder for remove passkey logic
  const removePasskey = useCallback(
    // Expect the original PasskeyWithStatus object (id should be defined by now)
    async (passkeyToRemove: PasskeyWithStatus) => {
      console.info(
        `${logPrefix} Starting 'removePasskey' for ID: ${passkeyToRemove.id}, CredentialID: ${passkeyToRemove.credentialId}`
      );
      // Use passkeyToRemove.id (the database ID)
      const passkeyDbId = passkeyToRemove.id;
      if (!passkeyDbId) {
        // This check might be redundant due to filtering, but keep for safety
        toast({ title: "Error", description: "Cannot remove passkey without database ID.", variant: "destructive" });
        return;
      }

      // Prevent removing the last passkey
      if (
        passkeys.filter((p) => p.status === PasskeyStatus.ACTIVE_ONCHAIN).length <= 1 &&
        passkeyToRemove.status === PasskeyStatus.ACTIVE_ONCHAIN
      ) {
        toast({
          title: "Action Denied",
          description: "Cannot remove the last active on-chain passkey.",
          variant: "destructive",
        });
        return;
      }

      const processId = passkeyDbId;
      setIsProcessing((prev) => ({ ...prev, [processId]: true }));

      try {
        // Scenario 1: Passkey is NOT on-chain (Pending or Unknown)
        if (passkeyToRemove.status !== PasskeyStatus.ACTIVE_ONCHAIN) {
          console.info(`${logPrefix} Scenario: Removing non-onchain passkey (ID: ${passkeyDbId}).`);
          toast({
            title: "Removing Passkey...",
            description: "Removing passkey record from server.",
            variant: "default",
          });
          // Simple backend deletion
          await pylon.deletePasskey(passkeyDbId);
          toast({ title: "Removed", description: "Passkey removed successfully.", variant: "default" });
        }
        // Scenario 2: Passkey IS on-chain
        else {
          console.info(`${logPrefix} Scenario: Removing on-chain passkey (ID: ${passkeyDbId}). Requires transaction.`);
          if (!user?.walletAddress || !passkeyToRemove.ownerAddress) {
            throw new Error("Missing wallet or owner address for on-chain removal.");
          }

          toast({
            title: "Removing Passkey...",
            description: "Requires on-chain transaction. Please sign.",
            variant: "default",
          });
          // Get signing credential
          const signingCredential = await selectCredential();

          // Prepare on-chain removal
          const safeAccount = new SafeAccount(user.walletAddress as Address);

          // Fetch current threshold
          const currentThreshold = await publicClient.readContract({
            address: user.walletAddress as Address,
            abi: SAFE_ABI,
            functionName: "getThreshold",
          });

          // Calculate new threshold (minimum 1)
          const newThreshold = Math.max(1, Number(currentThreshold) - 1);

          // Create removal transaction (using sentinel prevOwner '0x...1')
          const removeTx = await createRemoveOwnerTemplate(
            safeAccount,
            "0x0000000000000000000000000000000000000001", // Sentinel prevOwner
            passkeyToRemove.ownerAddress, // Owner to remove
            newThreshold
          );

          // Execute on-chain transaction
          await executeDirectTransaction({
            safeAddress: user.walletAddress as Address,
            transactions: removeTx,
            credentials: signingCredential,
            callbacks: {
              onError: (error: Error) => {
                // Throw error to be caught below if on-chain fails
                throw new Error(`On-chain removal failed: ${error.message}`);
              },
              onSuccess: async () => {
                // **Only delete from backend AFTER successful on-chain removal**
                try {
                  toast({
                    title: "Finalizing...",
                    description: "Removing passkey record from server.",
                    variant: "default",
                  });
                  await pylon.deletePasskey(passkeyDbId);
                  toast({ title: "Removed", description: "Passkey removed successfully.", variant: "default" });
                  // Refetch ONLY after successful backend deletion
                  console.info(`${logPrefix} Refetching passkeys after successful on-chain and backend removal.`);
                  await fetchPasskeys(false);
                } catch (backendError: any) {
                  console.error("Backend deletion failed after on-chain removal:", backendError);
                  toast({
                    title: "Partial Removal",
                    description: "Removed on-chain, but failed to remove backend record. Please contact support.",
                    variant: "destructive",
                  });
                  // Do NOT refetch here, state is inconsistent
                }
              },
            },
          });
          console.info(`${logPrefix} On-chain removal transaction initiated for passkey ID: ${passkeyDbId}.`);
        }

        console.info(`${logPrefix} 'removePasskey' processing completed for ID: ${passkeyDbId}.`);
      } catch (error: any) {
        console.error(`${logPrefix} Error during 'removePasskey' for ID ${passkeyDbId}:`, error);
        const errorMessage = error.message || "Could not remove passkey.";
        toast({ title: "Removal Error", description: errorMessage, variant: "destructive" });
      } finally {
        setIsProcessing((prev) => ({ ...prev, [processId]: false }));
      }
    },
    [passkeys, user?.walletAddress, selectCredential, toast, fetchPasskeys]
  );

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchPasskeys(true);
    } else {
      // If user context hasn't loaded user ID yet, don't show loading, wait for user.
      setIsLoading(false); // Set loading false if no user id yet
      setPasskeys([]);
    }
  }, [user?.id]); // Removed fetchPasskeys from deps

  return {
    passkeys, // Now PasskeyWithStatus[]
    isLoading: isLoading,
    isAddingPasskey: isAdding,
    isProcessingPasskey: isProcessing, // Expose processing state
    fetchPasskeys,
    addPasskey,
    activatePasskey,
    renamePasskey,
    removePasskey,
  };
}

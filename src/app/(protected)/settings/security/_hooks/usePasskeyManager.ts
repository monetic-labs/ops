import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/generics/useToast";
import pylon from "@/libs/monetic-sdk";
import { WebAuthnHelper } from "@/utils/webauthn";
import { isAxiosError } from "axios";
import { MerchantUserGetByIdOutput } from "@monetic-labs/sdk";

import { PasskeyStatus, syncPasskeysWithSafe, PasskeyWithStatus } from "@/utils/safe/features/passkey";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";
import { executeDirectTransaction } from "@/utils/safe/flows/direct";
import { createAddOwnerTemplate } from "@/utils/safe/templates";
import { SafeAccountV0_3_0 as SafeAccount } from "abstractionkit";
import { Address, Hex } from "viem";
import { PublicKey } from "ox";

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

  const fetchPasskeys = useCallback(
    async (showLoading = true) => {
      if (!user?.id) {
        // Check for user ID
        setPasskeys([]);
        setIsLoading(false);
        return;
      }
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
        console.error("Error fetching/syncing passkeys:", error);
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
    if (!user?.email || !user?.id) {
      toast({ title: "Error", description: "User information is missing.", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      await WebAuthnHelper.createPasskey(user.email); // This registers with Pylon
      toast({ title: "Success", description: "Passkey registered! Activate it to use on-chain.", variant: "default" });
      await fetchPasskeys(false); // Refresh list to show the new pending passkey
    } catch (error: any) {
      console.error("Error adding passkey:", error);
      if (error instanceof DOMException) {
        toast({
          title: "Registration Failed",
          description: `Could not create passkey: ${error.message}`,
          variant: "destructive",
        });
      } else {
        const errorMessage = isAxiosError(error)
          ? error.response?.data?.message || "An API error occurred"
          : error.message || "Failed to add passkey.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      }
    } finally {
      setIsAdding(false);
    }
  }, [user?.email, user?.id, toast, fetchPasskeys]);

  // Activate a pending passkey on-chain
  const activatePasskey = useCallback(
    async (passkey: PasskeyWithStatus) => {
      if (passkey.status !== PasskeyStatus.PENDING_ONCHAIN || !user?.walletAddress || !passkey.publicKey) {
        toast({ title: "Error", description: "Passkey cannot be activated.", variant: "destructive" });
        return;
      }

      setIsProcessing((prev) => ({ ...prev, [passkey.credentialId]: true }));
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
      } catch (error: any) {
        console.error("Error activating passkey:", error);
        const errorMessage = error.message || "Could not activate passkey.";
        toast({ title: "Activation Error", description: errorMessage, variant: "destructive" });
      } finally {
        setIsProcessing((prev) => ({ ...prev, [passkey.credentialId]: false }));
      }
    },
    [user?.walletAddress, selectCredential, toast, fetchPasskeys]
  );

  // Rename a passkey (off-chain)
  const renamePasskey = useCallback(
    async (passkeyId: string, newDisplayName: string) => {
      if (!passkeyId || !newDisplayName) return;

      setIsProcessing((prev) => ({ ...prev, [passkeyId]: true })); // Use passkeyId (DB id) for rename processing state
      try {
        await pylon.updatePasskeyDisplayName(passkeyId, { displayName: newDisplayName });
        toast({ title: "Renamed", description: "Passkey name updated.", variant: "default" });
        // Optimistic UI update might be better, but refetch is simpler for now
        await fetchPasskeys(false);
      } catch (error: any) {
        console.error("Error renaming passkey:", error);
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
    async (passkeyToRemove: PasskeyWithStatus) => {
      toast({ title: "Not Implemented", description: "Passkey removal is coming soon.", variant: "default" });
      // TODO: Implement remove owner logic
      // 1. Check if passkeys.length > 1
      // 2. Get signing credential using selectCredential()
      // 3. Determine prevOwner (might require fetching owners again)
      // 4. Call createRemoveOwnerTemplate
      // 5. Call executeDirectTransaction
      // 6. Call backend to delete passkey record off-chain
      // 7. Refetch passkeys
    },
    [passkeys.length, toast]
  ); // Dependency on passkeys.length

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchPasskeys(true);
    } else {
      setPasskeys([]);
      setIsLoading(false);
    }
  }, [user?.id]); // Fetch when user ID is available

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

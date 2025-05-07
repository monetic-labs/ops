import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/generics/useToast";
import pylon from "@/libs/monetic-sdk";
import { WebAuthnHelper } from "@/utils/webauthn";
import { isAxiosError } from "axios";
import { MerchantUserGetByIdOutput } from "@monetic-labs/sdk";

import { PasskeyStatus, Passkey, syncPasskeysWithSafe } from "@/utils/safe/features/passkey";
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

interface RegisteredPasskeyInput {
  id: string;
  credentialId: string;
  publicKey?: string;
  displayName?: string;
  lastUsedAt?: string;
  createdAt?: string;
  rpId: string;
}

export function usePasskeyManager({ user }: UsePasskeyManagerProps) {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const { selectCredential } = usePasskeySelection();
  const { forceAuthCheck } = useUser();

  const fetchPasskeys = useCallback(
    async (showLoading = true) => {
      if (!user?.id) {
        setPasskeys([]);
        setIsLoading(false);
        return;
      }
      console.info(`${logPrefix} Fetching passkeys for user: ${user.id}`);
      if (showLoading) {
        setIsLoading(true);
      }
      try {
        const userData = await pylon.getUserById();
        const rawPasskeys = userData?.registeredPasskeys || [];

        const typedRawPasskeys: RegisteredPasskeyInput[] = rawPasskeys.map((pk) => ({
          id: pk.id,
          credentialId: pk.credentialId,
          publicKey: pk.publicKey,
          displayName: pk.displayName,
          lastUsedAt: pk.lastUsedAt,
          createdAt: undefined,
          rpId: pk.rpId,
        }));

        const syncedPasskeys = await syncPasskeysWithSafe(user.walletAddress as Address | undefined, typedRawPasskeys);
        setPasskeys(syncedPasskeys);
      } catch (error) {
        console.error(`${logPrefix} Error fetching/syncing passkeys:`, error);
        toast({ title: "Error", description: "Failed to load passkey status.", variant: "destructive" });
        setPasskeys([]);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [user?.id, user?.walletAddress]
  );

  const addPasskey = useCallback(async () => {
    console.info(`${logPrefix} Starting 'addPasskey' for user: ${user?.id}`);
    if (!user?.email || !user?.id) {
      toast({ title: "Error", description: "User information is missing.", variant: "destructive" });
      return;
    }
    setIsAdding(true);
    try {
      if (!user.walletAddress) {
        console.info(`${logPrefix} Scenario: First passkey, deploying account.`);
        toast({
          title: "Creating Account...",
          description: "Setting up your secure account and first passkey.",
          variant: "default",
        });
        if (!user.phone) {
          throw new Error("A valid phone number is required to create the account.");
        }
        const { address: newWalletAddress } = await deployIndividualSafe({
          email: user.email,
          phone: user.phone,
          callbacks: {
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
            onError: (e) => console.error("Deployment callback error:", e),
          },
        });
        toast({
          title: "Account Created!",
          description: "Updating your profile with the new wallet address.",
          variant: "default",
        });
        await pylon.updateUser(user.id, { walletAddress: newWalletAddress });
        await forceAuthCheck();
        await fetchPasskeys(false);
        toast({
          title: "Setup Complete!",
          description: "Your account and first passkey are ready.",
          variant: "default",
        });
      } else {
        console.info(`${logPrefix} Scenario: Adding subsequent passkey (off-chain).`);
        toast({
          title: "Registering Passkey...",
          description: "Please follow the browser prompts.",
          variant: "default",
        });
        await WebAuthnHelper.createPasskey(user.email);
        toast({
          title: "Passkey Registered!",
          description: "Activate the new passkey to use it on-chain.",
          variant: "default",
        });
        await fetchPasskeys(false);
      }
      console.info(`${logPrefix} 'addPasskey' completed successfully.`);
    } catch (error: any) {
      console.error(`${logPrefix} Error during 'addPasskey':`, error);
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
      setIsAdding(false);
    }
  }, [user, fetchPasskeys, forceAuthCheck, toast]);

  const activatePasskey = useCallback(
    async (passkey: Passkey) => {
      console.info(`${logPrefix} Starting 'activatePasskey' for credential: ${passkey.credentialId}`);
      if (!user || !user.walletAddress) {
        toast({ title: "Error", description: "User or wallet information is missing.", variant: "destructive" });
        return;
      }
      if (passkey.status !== PasskeyStatus.PENDING_ONCHAIN || !passkey.publicKey) {
        toast({
          title: "Error",
          description: "Passkey cannot be activated or is missing public key.",
          variant: "destructive",
        });
        return;
      }

      const processId = passkey.id;
      setIsProcessing((prev) => ({ ...prev, [processId]: true }));
      try {
        const signingCredential = await selectCredential();
        toast({
          title: "Activating...",
          description: "Adding passkey to your Safe account. Please authorize.",
          variant: "default",
        });
        const { x, y } = PublicKey.fromHex(passkey.publicKey as Hex);
        const safeAccount = new SafeAccount(user.walletAddress as Address);
        const addOwnerTxs = await createAddOwnerTemplate(safeAccount, { x, y }, 1);
        await executeDirectTransaction({
          safeAddress: user.walletAddress as Address,
          transactions: addOwnerTxs,
          credentials: signingCredential,
          callbacks: {
            onSuccess: () => {
              toast({ title: "Activated!", description: "Passkey successfully added on-chain.", variant: "default" });
              fetchPasskeys(false);
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
    [user, selectCredential, fetchPasskeys, toast]
  );

  const renamePasskey = useCallback(
    async (passkeyId: string, newDisplayName: string) => {
      console.info(`${logPrefix} Starting 'renamePasskey' for ID: ${passkeyId} to name: ${newDisplayName}`);
      if (!passkeyId || !newDisplayName) return;
      setIsProcessing((prev) => ({ ...prev, [passkeyId]: true }));
      try {
        await pylon.updatePasskeyDisplayName(passkeyId, { displayName: newDisplayName });
        toast({ title: "Renamed", description: "Passkey name updated.", variant: "default" });
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
    [fetchPasskeys, toast]
  );

  const removePasskey = useCallback(
    async (passkeyToRemove: Passkey) => {
      console.info(
        `${logPrefix} Starting 'removePasskey' for ID: ${passkeyToRemove.id}, CredentialID: ${passkeyToRemove.credentialId}`
      );
      const passkeyDbId = passkeyToRemove.id;

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
        if (passkeyToRemove.status !== PasskeyStatus.ACTIVE_ONCHAIN) {
          console.info(`${logPrefix} Scenario: Removing non-onchain passkey (ID: ${passkeyDbId}).`);
          toast({
            title: "Removing Passkey...",
            description: "Removing passkey record from server.",
            variant: "default",
          });
          await pylon.deletePasskey(passkeyDbId);
          toast({ title: "Removed", description: "Passkey removed successfully.", variant: "default" });
          await fetchPasskeys(false);
        } else {
          console.info(`${logPrefix} Scenario: Removing on-chain passkey (ID: ${passkeyDbId}). Requires transaction.`);
          if (!user || !user.walletAddress || !passkeyToRemove.ownerAddress) {
            throw new Error("Missing user, wallet, or owner address for on-chain removal.");
          }
          toast({
            title: "Removing Passkey...",
            description: "Requires on-chain transaction. Please sign.",
            variant: "default",
          });
          const signingCredential = await selectCredential();
          const safeAccount = new SafeAccount(user.walletAddress as Address);
          const currentThreshold = await publicClient.readContract({
            address: user.walletAddress as Address,
            abi: SAFE_ABI,
            functionName: "getThreshold",
          });
          const newThreshold = Math.max(1, Number(currentThreshold) - 1);
          const removeTx = await createRemoveOwnerTemplate(
            safeAccount,
            "0x0000000000000000000000000000000000000001",
            passkeyToRemove.ownerAddress,
            newThreshold
          );
          await executeDirectTransaction({
            safeAddress: user.walletAddress as Address,
            transactions: removeTx,
            credentials: signingCredential,
            callbacks: {
              onError: (error: Error) => {
                throw new Error(`On-chain removal failed: ${error.message}`);
              },
              onSuccess: async () => {
                try {
                  toast({
                    title: "Finalizing...",
                    description: "Removing passkey record from server.",
                    variant: "default",
                  });
                  await pylon.deletePasskey(passkeyDbId);
                  toast({ title: "Removed", description: "Passkey removed successfully.", variant: "default" });
                  console.info(`${logPrefix} Refetching passkeys after successful on-chain and backend removal.`);
                  await fetchPasskeys(false);
                } catch (backendError: any) {
                  console.error("Backend deletion failed after on-chain removal:", backendError);
                  toast({
                    title: "Partial Removal",
                    description: "Removed on-chain, but failed to remove backend record. Please contact support.",
                    variant: "destructive",
                  });
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
    [passkeys, user, selectCredential, fetchPasskeys, toast]
  );

  useEffect(() => {
    if (user?.id) {
      fetchPasskeys(true);
    } else if (user === null || user === undefined) {
      setIsLoading(false);
      setPasskeys([]);
    }
  }, [user?.id, fetchPasskeys]);

  return {
    passkeys,
    isLoading: isLoading,
    isAddingPasskey: isAdding,
    isProcessingPasskey: isProcessing,
    fetchPasskeys,
    addPasskey,
    activatePasskey,
    renamePasskey,
    removePasskey,
  };
}

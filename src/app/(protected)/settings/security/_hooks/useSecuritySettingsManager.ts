import { useState, useCallback } from "react";
import { Address } from "viem";
import { RecoveryWalletMethod, MerchantUserGetByIdOutput } from "@monetic-labs/sdk";

import pylon from "@/libs/monetic-sdk";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";
import {
  addRecoveryMethod,
  removeRecoveryMethod,
  toggleMoneticRecovery,
  defaultSocialRecoveryModule,
} from "@/utils/safe/features/recovery";
import { executeDirectTransaction, DirectTransactionCallbacks } from "@/utils/safe/flows/direct";
import { TransferStatus } from "@/components/generics/transfer-status";
import { PendingChanges, RecoveryWallet } from "@/app/(protected)/settings/security/types";
import { WebAuthnCredentials } from "@/types/webauthn";
import { PUBLIC_RPC } from "@/config/web3";

interface UseSecuritySettingsManagerProps {
  user: MerchantUserGetByIdOutput | undefined;
  pendingChanges: PendingChanges;
  threshold: number;
  currentThreshold: number;
  isMoneticRecoveryEnabled: boolean; // The *desired* state after UI toggle
  recoveryWallets: RecoveryWallet[]; // Needed to find public address for removal
  fetchRecoveryWallets: () => Promise<void>;
  clearPendingChanges: () => void;
}

export function useSecuritySettingsManager({
  user,
  pendingChanges,
  threshold,
  currentThreshold,
  isMoneticRecoveryEnabled,
  recoveryWallets,
  fetchRecoveryWallets,
  clearPendingChanges,
}: UseSecuritySettingsManagerProps) {
  const { selectCredential } = usePasskeySelection();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<TransferStatus>(TransferStatus.IDLE);

  const saveSettings = useCallback(async () => {
    const thresholdChanged = threshold !== currentThreshold;
    const hasAnyChanges =
      pendingChanges.toAdd.length > 0 ||
      pendingChanges.toDelete.length > 0 ||
      pendingChanges.toggleMonetic ||
      thresholdChanged;

    if (!user?.walletAddress || !hasAnyChanges) {
      console.log("Save skipped: No user wallet address or no changes detected.");
      return;
    }

    setIsSaving(true);
    setStatus(TransferStatus.PREPARING);

    try {
      const safeAddress = user.walletAddress as Address;
      const credential = await selectCredential();
      let operationPerformed = false;

      // Define shared callbacks
      const callbacks: DirectTransactionCallbacks = {
        onPreparing: () => setStatus(TransferStatus.PREPARING),
        onSigning: () => setStatus(TransferStatus.SIGNING),
        onSuccess: (receipt) => {
          console.log("Direct transaction succeeded with receipt:", receipt);
          console.log(`   ✅ Successfully changed threshold to ${threshold}`);
          operationPerformed = true;
        },
        onError: (error) => {
          console.error("Transaction error callback:", error);
          setStatus(TransferStatus.ERROR);
        },
      };

      // --- Threshold-Only Change ---
      if (
        !pendingChanges.toggleMonetic &&
        pendingChanges.toAdd.length === 0 &&
        pendingChanges.toDelete.length === 0 &&
        thresholdChanged
      ) {
        console.log(`⚙️ Processing threshold-only change to: ${threshold}...`);
        const changeThresholdTx = await defaultSocialRecoveryModule.createChangeThresholdMetaTransaction(
          BigInt(threshold)
        );
        const result = await executeDirectTransaction({
          safeAddress,
          transactions: [changeThresholdTx],
          credentials: credential,
          callbacks,
        });
        if (!result) throw new Error("Threshold change transaction failed.");
        console.log(`   ✅ Successfully changed threshold to ${threshold}`);
        operationPerformed = true;
      }
      // --- Process other pending changes ---
      else if (pendingChanges.toAdd.length > 0 || pendingChanges.toDelete.length > 0 || pendingChanges.toggleMonetic) {
        // Additions
        if (pendingChanges.toAdd.length > 0) {
          console.log(`➕ Processing ${pendingChanges.toAdd.length} additions...`);
          for (const method of pendingChanges.toAdd) {
            await addRecoveryMethod({
              accountAddress: safeAddress,
              credentials: credential,
              identifier: method.identifier,
              method: method.method,
              threshold: threshold,
              callbacks: callbacks,
            });
            operationPerformed = true;
          }
        }
        // Deletions
        if (pendingChanges.toDelete.length > 0) {
          console.log(`➖ Processing ${pendingChanges.toDelete.length} deletions...`);
          for (const walletId of pendingChanges.toDelete) {
            const walletToRemove = recoveryWallets.find((w) => w.id === walletId);
            if (!walletToRemove?.publicAddress) {
              console.warn(`Skipping deletion for ID ${walletId}: public address not found.`);
              continue;
            }
            await removeRecoveryMethod({
              accountAddress: safeAddress,
              credentials: credential,
              guardianAddress: walletToRemove.publicAddress as Address,
              threshold: threshold,
              callbacks: callbacks,
            });
            operationPerformed = true;
          }
        }
        // Monetic Toggle
        if (pendingChanges.toggleMonetic) {
          // Prevent disabling Monetic Recovery
          if (!isMoneticRecoveryEnabled) {
            console.warn("Attempted to disable Monetic Recovery. Operation blocked.");
            // Skip the toggle operation entirely
            operationPerformed = false;
          } else {
            // Proceed with ENABLING Monetic Recovery
            console.log(`🔒 Processing Monetic toggle to: ENABLE`);

            // Determine the correct threshold for the toggle operation (Threshold is only relevant when adding)
            const thresholdForCall = threshold; // Use the current UI threshold when enabling

            console.log(`   - Target State: Enable`);
            console.log(`   - Threshold for call: ${thresholdForCall}`);

            await toggleMoneticRecovery({
              accountAddress: safeAddress,
              credentials: credential,
              enable: true, // Force enable to true
              threshold: thresholdForCall,
              callbacks: callbacks,
            });
            operationPerformed = true;
          }
        }
      }

      // --- Final Success Handling ---
      if (operationPerformed) {
        console.log("✅ Blockchain operations completed successfully.");
        // Clean up backend records for deleted wallets
        if (pendingChanges.toDelete.length > 0) {
          console.log("🧹 Cleaning up backend records...");
          await Promise.allSettled(
            pendingChanges.toDelete.map(async (walletId) => {
              try {
                await pylon.deleteRecoveryWallet(walletId);
              } catch (e) {
                /* Log or ignore backend delete error */
              }
            })
          );
        }
        setStatus(TransferStatus.SENT);
        clearPendingChanges();
        await fetchRecoveryWallets();
        setTimeout(() => setStatus(TransferStatus.IDLE), 5000);
      } else if (status !== TransferStatus.ERROR) {
        // No operation was performed, but no error occurred (e.g., only threshold changed but failed validation?)
        console.log("🤷 No blockchain operations were executed.");
        setStatus(TransferStatus.IDLE);
      }
    } catch (error: any) {
      console.error("❌ Overall error saving security settings:", error);
      if (status !== TransferStatus.ERROR) {
        setStatus(TransferStatus.ERROR);
      }
      // Revert optimistic UI updates on error
      await fetchRecoveryWallets();
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    pendingChanges,
    threshold,
    currentThreshold,
    isMoneticRecoveryEnabled,
    recoveryWallets,
    selectCredential,
    fetchRecoveryWallets,
    clearPendingChanges,
    status, // Include status to prevent stale closures in final success handling
  ]);

  return { isSaving, status, saveSettings };
}

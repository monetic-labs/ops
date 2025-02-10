import { useState, useEffect } from "react";
import { RecoveryWallet, ConfiguredEmail, ConfiguredPhone } from "@/components/account-settings/security/types";
import { RecoveryWalletMethod } from "@backpack-fux/pylon-sdk";
import { useAccounts } from "@/contexts/AccountContext";
import pylon from "@/libs/pylon-sdk";
import { socialRecovery } from "@/utils/safeAccount/socialRecovery";

type RecoveryWalletGenerateInput = {
  identifier: string;
  method: RecoveryWalletMethod;
};

export const useRecoveryWallets = (isOpen: boolean) => {
  const [recoveryWallets, setRecoveryWallets] = useState<RecoveryWallet[]>([]);
  const [configuredEmails, setConfiguredEmails] = useState<ConfiguredEmail[]>([]);
  const [configuredPhone, setConfiguredPhone] = useState<ConfiguredPhone | null>(null);
  const [isBackpackRecoveryEnabled, setIsBackpackRecoveryEnabled] = useState(false);
  const { user } = useAccounts();

  const fetchRecoveryWallets = async () => {
    try {
      const wallets = await pylon.getRecoveryWallets();
      setRecoveryWallets(wallets);

      // Set configured emails
      const emailWallets = wallets.filter((w) => w.recoveryMethod === RecoveryWalletMethod.EMAIL);
      setConfiguredEmails(
        emailWallets.map((w) => ({
          email: w.identifier,
          isVerified: true,
          recoveryWalletId: w.id,
        }))
      );

      // Set configured phone
      const phoneWallet = wallets.find((w) => w.recoveryMethod === RecoveryWalletMethod.PHONE);
      if (phoneWallet) {
        setConfiguredPhone({
          number: phoneWallet.identifier,
          isVerified: true,
          recoveryWalletId: phoneWallet.id,
        });
      }

      // Check Backpack guardian status
      try {
        const isBackpackGuardian = await socialRecovery.isBackpackGuardian(user?.walletAddress as `0x${string}`);
        setIsBackpackRecoveryEnabled(isBackpackGuardian);
      } catch (error) {
        console.error("Failed to check Backpack guardian status:", error);
        setIsBackpackRecoveryEnabled(false);
      }
    } catch (error) {
      console.error("Failed to fetch recovery wallets:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecoveryWallets();
    }
  }, [isOpen]);

  return {
    recoveryWallets,
    configuredEmails,
    configuredPhone,
    isBackpackRecoveryEnabled,
    setConfiguredEmails,
    setConfiguredPhone,
    setIsBackpackRecoveryEnabled,
    fetchRecoveryWallets,
  };
};

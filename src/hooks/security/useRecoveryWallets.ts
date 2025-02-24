import { useState, useEffect } from "react";
import { RecoveryWalletMethod } from "@backpack-fux/pylon-sdk";
import { Address } from "viem";

import { RecoveryWallet, ConfiguredEmail, ConfiguredPhone } from "@/components/account-settings/security/types";
import { useUser } from "@/contexts/UserContext";
import { isBackpackGuardian } from "@/utils/socialRecovery";
import pylon from "@/libs/pylon-sdk";

type RecoveryWalletGenerateInput = {
  identifier: string;
  method: RecoveryWalletMethod;
};

export const useRecoveryWallets = (isOpen: boolean) => {
  const [recoveryWallets, setRecoveryWallets] = useState<RecoveryWallet[]>([]);
  const [configuredEmails, setConfiguredEmails] = useState<ConfiguredEmail[]>([]);
  const [configuredPhone, setConfiguredPhone] = useState<ConfiguredPhone | null>(null);
  const [isBackpackRecoveryEnabled, setIsBackpackRecoveryEnabled] = useState(false);
  const { user } = useUser();

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
      if (user?.walletAddress) {
        try {
          const isGuardian = await isBackpackGuardian(user.walletAddress as Address);

          setIsBackpackRecoveryEnabled(isGuardian);
        } catch (error) {
          console.error("Failed to check Backpack guardian status:", error);
          setIsBackpackRecoveryEnabled(false);
        }
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

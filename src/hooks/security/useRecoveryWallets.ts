import { useState, useEffect } from "react";
import { RecoveryWalletMethod } from "@monetic-labs/sdk";
import { Address } from "viem";

import { RecoveryWallet, ConfiguredEmail, ConfiguredPhone } from "@/components/account-settings/security/types";
import { useUser } from "@/contexts/UserContext";
import { defaultSocialRecoveryModule, isModuleEnabled, getGuardianThreshold } from "@/utils/safe/features/recovery";
import { MONETIC_GUARDIAN_ADDRESS } from "@/utils/constants";
import { PUBLIC_RPC } from "@/config/web3";
import pylon from "@/libs/monetic-sdk";

export const useRecoveryWallets = (isOpen: boolean) => {
  const [recoveryWallets, setRecoveryWallets] = useState<RecoveryWallet[]>([]);
  const [configuredEmails, setConfiguredEmails] = useState<ConfiguredEmail[]>([]);
  const [configuredPhone, setConfiguredPhone] = useState<ConfiguredPhone | null>(null);
  const [isMoneticRecoveryEnabled, setIsMoneticRecoveryEnabled] = useState(false);
  const [isModuleInstalled, setIsModuleInstalled] = useState(false);
  const [currentThreshold, setCurrentThreshold] = useState(0);
  const { user } = useUser();

  const fetchRecoveryWallets = async () => {
    if (!user?.walletAddress) return;

    try {
      // First check if the module is installed
      const moduleEnabled = await isModuleEnabled(user.walletAddress as Address);
      setIsModuleInstalled(moduleEnabled);

      // If module isn't enabled yet, don't try to fetch guardians
      if (!moduleEnabled) {
        setRecoveryWallets([]);
        setConfiguredEmails([]);
        setConfiguredPhone(null);
        setIsMoneticRecoveryEnabled(false);
        setCurrentThreshold(0);
        return;
      }

      // Get the current threshold from the module
      const threshold = await getGuardianThreshold(user.walletAddress as Address);
      setCurrentThreshold(threshold);

      // 1. Get all guardians from the blockchain (single source of truth)
      const onChainGuardians = await defaultSocialRecoveryModule.getGuardians(
        PUBLIC_RPC,
        user.walletAddress as Address
      );

      // 2. Get all recovery wallets from Pylon (for user-friendly identifiers)
      const pylonWallets = await pylon.getRecoveryWallets();

      // 3. Check if Monetic is a guardian
      const moneticAddressLower = MONETIC_GUARDIAN_ADDRESS.toLowerCase();
      let isMoneticGuardian = false;

      // Manually check each guardian address with case-insensitive comparison
      for (let i = 0; i < onChainGuardians.length; i++) {
        const guardianAddress = onChainGuardians[i].toLowerCase();
        if (guardianAddress === moneticAddressLower) {
          isMoneticGuardian = true;
          break;
        }
      }

      // Only log critical status info
      console.log("🎒 Monetic guardian status:", isMoneticGuardian ? "Enabled" : "Disabled");

      setIsMoneticRecoveryEnabled(isMoneticGuardian);

      // 4. Map on-chain guardians to Pylon wallets
      const matchedWallets: RecoveryWallet[] = [];

      // Process each on-chain guardian address
      for (const guardianAddress of onChainGuardians) {
        if (guardianAddress.toLowerCase() === MONETIC_GUARDIAN_ADDRESS.toLowerCase()) {
          // Skip Monetic guardian as it's handled separately
          continue;
        }

        // Find matching Pylon wallet by address
        const pylonWallet = pylonWallets.find((w) => w.publicAddress.toLowerCase() === guardianAddress.toLowerCase());

        if (pylonWallet) {
          // If we found a match in Pylon, use its details
          matchedWallets.push(pylonWallet);
        } else {
          // If no match in Pylon, create a placeholder wallet
          matchedWallets.push({
            id: `blockchain-${guardianAddress}`,
            identifier: `Unknown Guardian (${guardianAddress.substring(0, 6)}...${guardianAddress.substring(guardianAddress.length - 4)})`,
            recoveryMethod: "UNKNOWN" as any,
            publicAddress: guardianAddress as string,
            userCustodialId: "",
            custodialProvider: "",
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            userId: "",
          });
        }
      }

      setRecoveryWallets(matchedWallets);

      // 5. Set configured emails
      const emailWallets = matchedWallets.filter((w) => w.recoveryMethod === RecoveryWalletMethod.EMAIL);
      setConfiguredEmails(
        emailWallets.map((w) => ({
          email: w.identifier,
          isVerified: true,
          recoveryWalletId: w.id,
        }))
      );

      // 6. Set configured phone
      const phoneWallet = matchedWallets.find((w) => w.recoveryMethod === RecoveryWalletMethod.PHONE);
      if (phoneWallet) {
        setConfiguredPhone({
          number: phoneWallet.identifier,
          isVerified: true,
          recoveryWalletId: phoneWallet.id,
        });
      } else {
        setConfiguredPhone(null);
      }
    } catch (error) {
      console.error("❌ Failed to fetch recovery wallets:", error);
    }
  };

  useEffect(() => {
    if (isOpen && user?.walletAddress) {
      fetchRecoveryWallets();
    }
  }, [isOpen, user?.walletAddress]);

  return {
    recoveryWallets,
    configuredEmails,
    configuredPhone,
    isMoneticRecoveryEnabled,
    isModuleInstalled,
    currentThreshold,
    setConfiguredEmails,
    setConfiguredPhone,
    setIsMoneticRecoveryEnabled,
    fetchRecoveryWallets,
  };
};

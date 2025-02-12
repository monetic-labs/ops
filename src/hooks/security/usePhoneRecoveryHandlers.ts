import { ConfiguredPhone } from "@/components/account-settings/security/types";
import { PhoneVerification, PendingChanges } from "./types";
import { RecoveryWalletMethod } from "@backpack-fux/pylon-sdk";
import { Address } from "viem";
import pylon from "@/libs/pylon-sdk";
import { createAddGuardianTransaction } from "@/utils/socialRecovery";

type UsePhoneRecoveryHandlersProps = {
  configuredPhone: ConfiguredPhone | null;
  setConfiguredPhone: React.Dispatch<React.SetStateAction<ConfiguredPhone | null>>;
  phoneVerification: PhoneVerification;
  addPendingChange: (change: Partial<PendingChanges>) => void;
  threshold: number;
  userAddress?: string;
};

export const usePhoneRecoveryHandlers = ({
  configuredPhone,
  setConfiguredPhone,
  phoneVerification,
  addPendingChange,
  threshold,
  userAddress,
}: UsePhoneRecoveryHandlersProps) => {
  const handleAddPhone = (phone: string) => {
    if (!phone || configuredPhone) return;

    setConfiguredPhone({ number: phone, isVerified: false });
    phoneVerification.setVerifyingPhone(phone);
    phoneVerification.setCurrentPhone("");
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneVerification.verifyingPhone || !configuredPhone || !userAddress) return;

    try {
      setConfiguredPhone({ ...configuredPhone, isVerified: true });

      const newWallets = await pylon.generateRecoveryWallets([
        {
          identifier: phoneVerification.verifyingPhone,
          method: RecoveryWalletMethod.PHONE,
        },
      ]);

      if (newWallets?.[0]) {
        addPendingChange({
          onChainTransactions: [
            createAddGuardianTransaction(newWallets[0].publicAddress as Address, BigInt(threshold)),
          ],
        });
      }

      phoneVerification.clearPhoneVerification();
    } catch (error) {
      console.error("Failed to verify phone:", error);
    }
  };

  const handleCancelPhoneVerification = () => {
    if (!phoneVerification.verifyingPhone) return;

    setConfiguredPhone(null);
    phoneVerification.clearPhoneVerification();
  };

  const handleRemovePhone = () => {
    if (!configuredPhone?.recoveryWalletId) return;

    addPendingChange({
      toDelete: [configuredPhone.recoveryWalletId],
    });

    setConfiguredPhone(null);
    if (phoneVerification.verifyingPhone) {
      phoneVerification.clearPhoneVerification();
    }
  };

  return {
    handleAddPhone,
    handleVerifyPhoneOtp,
    handleCancelPhoneVerification,
    handleRemovePhone,
  };
};

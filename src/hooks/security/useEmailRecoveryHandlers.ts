import { ConfiguredEmail } from "@/components/account-settings/security/types";
import { EmailVerification, PendingChanges } from "./types";
import { RecoveryWalletMethod } from "@backpack-fux/pylon-sdk";
import { Address } from "viem";
import pylon from "@/libs/pylon-sdk";
import { createAddGuardianTransaction } from "@/utils/socialRecovery";

type UseEmailRecoveryHandlersProps = {
  configuredEmails: ConfiguredEmail[];
  setConfiguredEmails: React.Dispatch<React.SetStateAction<ConfiguredEmail[]>>;
  emailVerification: EmailVerification;
  addPendingChange: (change: Partial<PendingChanges>) => void;
  threshold: number;
  userAddress?: string;
};

export const useEmailRecoveryHandlers = ({
  configuredEmails,
  setConfiguredEmails,
  emailVerification,
  addPendingChange,
  threshold,
  userAddress,
}: UseEmailRecoveryHandlersProps) => {
  const handleAddEmail = (email: string) => {
    if (!email || configuredEmails.some((e) => e.email === email)) return;

    const newEmail = { email, isVerified: false };
    setConfiguredEmails((prev) => [...prev, newEmail]);
    emailVerification.setVerifyingEmail(email);
    emailVerification.setCurrentEmail("");

    addPendingChange({
      toAdd: [
        {
          identifier: email,
          method: RecoveryWalletMethod.EMAIL,
        },
      ],
    });
  };

  const handleVerifyOtp = async () => {
    if (!emailVerification.verifyingEmail || !userAddress) return;

    try {
      setConfiguredEmails((prev) =>
        prev.map((email) => (email.email === emailVerification.verifyingEmail ? { ...email, isVerified: true } : email))
      );

      const newWallets = await pylon.generateRecoveryWallets([
        {
          identifier: emailVerification.verifyingEmail,
          method: RecoveryWalletMethod.EMAIL,
        },
      ]);

      if (newWallets?.[0]) {
        addPendingChange({
          onChainTransactions: [
            createAddGuardianTransaction(newWallets[0].publicAddress as Address, BigInt(threshold)),
          ],
        });
      }

      emailVerification.clearEmailVerification();
    } catch (error) {
      console.error("Failed to verify email:", error);
    }
  };

  const handleCancelVerification = () => {
    if (!emailVerification.verifyingEmail) return;

    setConfiguredEmails((prev) => prev.filter((email) => email.email !== emailVerification.verifyingEmail));
    emailVerification.clearEmailVerification();
  };

  const handleRemoveEmail = (email: string) => {
    const emailToRemove = configuredEmails.find((e) => e.email === email);
    if (!emailToRemove?.recoveryWalletId) return;

    addPendingChange({
      toDelete: [emailToRemove.recoveryWalletId],
    });

    if (emailVerification.verifyingEmail === email) {
      emailVerification.clearEmailVerification();
    }
  };

  return {
    handleAddEmail,
    handleVerifyOtp,
    handleCancelVerification,
    handleRemoveEmail,
  };
};

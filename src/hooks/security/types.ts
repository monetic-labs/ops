import { RecoveryWalletMethod } from "@backpack-fux/pylon-sdk";
import { MetaTransaction } from "abstractionkit";
import { ConfiguredEmail, ConfiguredPhone, RecoveryWallet } from "@/components/account-settings/security/types";

export type RecoveryWalletGenerateInput = {
  identifier: string;
  method: RecoveryWalletMethod;
};

export type PendingChanges = {
  toAdd: RecoveryWalletGenerateInput[];
  toDelete: string[];
  onChainTransactions: MetaTransaction[];
};

export type EmailVerification = {
  currentEmail: string;
  verifyingEmail: string | null;
  otpValue: string;
  setCurrentEmail: (email: string) => void;
  setVerifyingEmail: (email: string | null) => void;
  setOtpValue: (otp: string) => void;
  clearEmailVerification: () => void;
};

export type PhoneVerification = {
  currentPhone: string;
  verifyingPhone: string | null;
  phoneOtpValue: string;
  setCurrentPhone: (phone: string) => void;
  setVerifyingPhone: (phone: string | null) => void;
  setPhoneOtpValue: (otp: string) => void;
  clearPhoneVerification: () => void;
};

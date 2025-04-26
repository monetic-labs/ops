import { RecoveryWalletMethod } from "@monetic-labs/sdk";

export type SecuritySettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type RecoveryMethod = "PHONE" | "EMAIL" | "MONETIC" | "TEAM" | "HARDWARE";

export type RecoveryWallet = {
  id: string;
  identifier: string;
  recoveryMethod: RecoveryMethod;
  publicAddress: string;
  userCustodialId: string;
  custodialProvider: string;
  updatedAt: string;
  createdAt: string;
  userId: string;
};

export type ConfiguredEmail = {
  email: string;
  isVerified: boolean;
  recoveryWalletId?: string;
};

export type ConfiguredPhone = {
  number: string;
  isVerified: boolean;
  recoveryWalletId?: string;
};

export type OrgMember = {
  id: string;
  displayName: string;
  email: string;
  role: "OWNER" | "MEMBER";
};

export interface EmailVerificationProps {
  configuredEmails: ConfiguredEmail[];
  currentEmail: string;
  verifyingEmail: string | null;
  otpValue: string;
  onAddEmail: (email: string) => void;
  onVerifyOtp: () => void;
  onCancelVerification: () => void;
  onRemoveEmail: (email: string) => void;
  onEmailChange: (email: string) => void;
  onOtpChange: (otp: string) => void;
  pendingDeletions?: string[];
}

export type PhoneVerificationProps = {
  configuredPhone: ConfiguredPhone | null;
  currentPhone: string;
  verifyingPhone: string | null;
  phoneOtpValue: string;
  onAddPhone: (phone: string) => void;
  onVerifyPhoneOtp: () => void;
  onCancelPhoneVerification: () => void;
  onRemovePhone: () => void;
  onPhoneChange: (phone: string) => void;
  onPhoneOtpChange: (otp: string) => void;
};

export type TeamRecoveryProps = {
  configuredTeamMember: OrgMember | null;
  onSelectTeamMember: (memberId: string) => void;
  onRemoveTeamMember: () => void;
};

export type RecoveryWalletGenerateInput = {
  identifier: string;
  method: RecoveryWalletMethod;
};

export interface PendingChanges {
  toAdd: Array<{
    identifier: string;
    method: RecoveryWalletMethod;
  }>;
  toDelete: string[];
  toggleMonetic: boolean;
}

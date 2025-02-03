export type SecuritySettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type ConfiguredEmail = {
  email: string;
  isVerified: boolean;
};

export type ConfiguredPhone = {
  number: string;
  isVerified: boolean;
};

export type OrgMember = {
  id: string;
  displayName: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

export type EmailVerificationProps = {
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
};

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

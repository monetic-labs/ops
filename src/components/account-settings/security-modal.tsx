"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalBody } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { XIcon } from "lucide-react";
import { RECOVERY_OPTIONS } from "./security/constants";
import { SecuritySettingsModalProps, ConfiguredEmail, ConfiguredPhone } from "./security/types";
import { RecoveryWarning, RecoveryOptions, GracePeriod, DeadSwitch } from "./security/components";

export const SecuritySettingsModal = ({ isOpen, onClose }: SecuritySettingsModalProps) => {
  const [selectedGracePeriod, setSelectedGracePeriod] = useState<string>("7");
  const [selectedDeadSwitch, setSelectedDeadSwitch] = useState<string>("12");
  const [configuredEmails, setConfiguredEmails] = useState<ConfiguredEmail[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [isBackpackRecoveryEnabled, setIsBackpackRecoveryEnabled] = useState(false);

  // Phone verification state
  const [configuredPhone, setConfiguredPhone] = useState<ConfiguredPhone | null>(null);
  const [currentPhone, setCurrentPhone] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState<string | null>(null);
  const [phoneOtpValue, setPhoneOtpValue] = useState("");

  const configuredCount =
    configuredEmails.filter((e) => e.isVerified).length +
    (isBackpackRecoveryEnabled ? 1 : 0) +
    (configuredPhone?.isVerified ? 1 : 0) +
    RECOVERY_OPTIONS.filter(
      (opt) => opt.id !== "email" && opt.id !== "backpack" && opt.id !== "phone" && opt.isConfigured
    ).length;

  const handleAddEmail = (email: string) => {
    if (!email || configuredEmails.some((e) => e.email === email)) return;

    const newEmail = { email, isVerified: false };
    setConfiguredEmails((prev) => [...prev, newEmail]);
    setVerifyingEmail(email);
    setCurrentEmail("");
  };

  const handleVerifyOtp = () => {
    if (!verifyingEmail) return;

    // Here you would typically verify the OTP with your API
    setConfiguredEmails((prev) =>
      prev.map((email) => (email.email === verifyingEmail ? { ...email, isVerified: true } : email))
    );
    setVerifyingEmail(null);
    setOtpValue("");
  };

  const handleCancelVerification = () => {
    if (!verifyingEmail) return;

    setConfiguredEmails((prev) => prev.filter((email) => email.email !== verifyingEmail));
    setVerifyingEmail(null);
    setOtpValue("");
  };

  const handleRemoveEmail = (email: string) => {
    setConfiguredEmails((prev) => prev.filter((e) => e.email !== email));
    if (verifyingEmail === email) {
      setVerifyingEmail(null);
      setOtpValue("");
    }
  };

  const handleBackpackRecoveryToggle = async () => {
    // Here you would trigger the WebAuthn popup and handle the response
    // For now, we'll just toggle the state
    setIsBackpackRecoveryEnabled((prev) => !prev);
  };

  // Phone handlers
  const handleAddPhone = (phone: string) => {
    if (!phone || configuredPhone) return;

    setConfiguredPhone({ number: phone, isVerified: false });
    setVerifyingPhone(phone);
    setCurrentPhone("");
  };

  const handleVerifyPhoneOtp = () => {
    if (!verifyingPhone || !configuredPhone) return;

    // Here you would typically verify the OTP with your API
    setConfiguredPhone({ ...configuredPhone, isVerified: true });
    setVerifyingPhone(null);
    setPhoneOtpValue("");
  };

  const handleCancelPhoneVerification = () => {
    if (!verifyingPhone) return;

    setConfiguredPhone(null);
    setVerifyingPhone(null);
    setPhoneOtpValue("");
  };

  const handleRemovePhone = () => {
    setConfiguredPhone(null);
    if (verifyingPhone) {
      setVerifyingPhone(null);
      setPhoneOtpValue("");
    }
  };

  return (
    <Modal
      hideCloseButton
      classNames={{
        base: "bg-[#0A0A0A]",
        backdrop: "bg-black/80",
        body: "p-0",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <div className="flex flex-col">
            <h3 className="text-xl font-normal text-white">Security Settings</h3>
            <p className="text-sm text-gray-400">Configure your account recovery options</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              className="text-gray-400 hover:text-white transition-colors"
              variant="light"
              onClick={onClose}
            >
              <XIcon size={18} />
            </Button>
          </div>
        </div>
        <ModalBody className="p-4 sm:p-6 space-y-6">
          {/* Recovery Options Section */}
          <div className="space-y-4">
            <RecoveryWarning configuredCount={configuredCount} />
            <RecoveryOptions
              configuredCount={configuredCount}
              configuredEmails={configuredEmails}
              currentEmail={currentEmail}
              verifyingEmail={verifyingEmail}
              otpValue={otpValue}
              onAddEmail={handleAddEmail}
              onVerifyOtp={handleVerifyOtp}
              onCancelVerification={handleCancelVerification}
              onRemoveEmail={handleRemoveEmail}
              onEmailChange={setCurrentEmail}
              onOtpChange={setOtpValue}
              onBackpackRecoveryToggle={handleBackpackRecoveryToggle}
              isBackpackRecoveryEnabled={isBackpackRecoveryEnabled}
              configuredPhone={configuredPhone}
              currentPhone={currentPhone}
              verifyingPhone={verifyingPhone}
              phoneOtpValue={phoneOtpValue}
              onAddPhone={handleAddPhone}
              onVerifyPhoneOtp={handleVerifyPhoneOtp}
              onCancelPhoneVerification={handleCancelPhoneVerification}
              onRemovePhone={handleRemovePhone}
              onPhoneChange={setCurrentPhone}
              onPhoneOtpChange={setPhoneOtpValue}
            />
          </div>

          {/* Grace Period Section */}
          <GracePeriod selectedGracePeriod={selectedGracePeriod} onGracePeriodChange={setSelectedGracePeriod} />

          {/* Dead Switch Section */}
          <DeadSwitch selectedDeadSwitch={selectedDeadSwitch} onDeadSwitchChange={setSelectedDeadSwitch} />

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button className="w-full sm:w-auto" color="primary" isDisabled={configuredCount < 3} size="lg">
              Save Security Settings
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

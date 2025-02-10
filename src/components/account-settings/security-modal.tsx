"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalBody } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Chip } from "@nextui-org/chip";
import { XIcon } from "lucide-react";
import { Address } from "viem";

import pylon from "@/libs/pylon-sdk";
import { RECOVERY_OPTIONS, MOCK_ORG_MEMBERS, OrgMember } from "./security/constants";
import { SecuritySettingsModalProps, ConfiguredEmail, ConfiguredPhone, RecoveryWallet } from "./security/types";
import { DeadSwitch } from "./security/components/dead-switch";
import { EmailVerification } from "./security/components/recovery-options/email-verification";
import { PhoneVerification } from "./security/components/recovery-options/phone-verification";
import { TeamRecovery } from "./security/components/recovery-options/team-recovery";
import { BackpackRecovery } from "./security/components/recovery-options/backpack-recovery";
import { GracePeriod } from "./security/components/grace-period";
import { RecoveryWarning } from "./security/components/recovery-warning";
import { RecoveryHeader } from "./security/components/recovery-header";
import { useAccounts } from "@/contexts/AccountContext";
import { socialRecovery } from "@/utils/safeAccount/socialRecovery";
import { RecoveryWalletMethod } from "@backpack-fux/pylon-sdk";

export const SecuritySettingsModal = ({ isOpen, onClose }: SecuritySettingsModalProps) => {
  const [selectedGracePeriod, setSelectedGracePeriod] = useState<string>("7");
  const [selectedDeadSwitch, setSelectedDeadSwitch] = useState<string>("12");
  const [configuredEmails, setConfiguredEmails] = useState<ConfiguredEmail[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [isBackpackRecoveryEnabled, setIsBackpackRecoveryEnabled] = useState(false);
  const [recoveryWallets, setRecoveryWallets] = useState<RecoveryWallet[]>([]);
  const { user } = useAccounts();

  // Calculate total configured recovery options including Backpack
  const configuredCount = recoveryWallets.length + (isBackpackRecoveryEnabled ? 1 : 0);

  // Set threshold to match configured count, defaulting to 3
  const [threshold, setThreshold] = useState(3);

  useEffect(() => {
    // Update threshold when configured count changes
    if (configuredCount > 0) {
      setThreshold(configuredCount);
    }
  }, [configuredCount]);

  // Phone verification state
  const [configuredPhone, setConfiguredPhone] = useState<ConfiguredPhone | null>(null);
  const [currentPhone, setCurrentPhone] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState<string | null>(null);
  const [phoneOtpValue, setPhoneOtpValue] = useState("");

  // Team recovery state
  const [configuredTeamMember, setConfiguredTeamMember] = useState<OrgMember | null>(null);

  useEffect(() => {
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

        // Check Backpack guardian status using Candide
        try {
          const isBackpackGuardian = await socialRecovery.isBackpackGuardian(user?.walletAddress as Address);
          setIsBackpackRecoveryEnabled(isBackpackGuardian);
        } catch (error) {
          console.error("Failed to check Backpack guardian status:", error);
          setIsBackpackRecoveryEnabled(false);
        }
      } catch (error) {
        console.error("Failed to fetch recovery wallets:", error);
      }
    };

    if (isOpen) {
      fetchRecoveryWallets();
    }
  }, [isOpen]);

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

  // Team recovery handlers
  const handleSelectTeamMember = (memberId: string) => {
    const member = MOCK_ORG_MEMBERS.find((m) => m.id === memberId);

    if (member) {
      setConfiguredTeamMember(member);
    }
  };

  const handleRemoveTeamMember = () => {
    setConfiguredTeamMember(null);
  };

  return (
    <Modal
      hideCloseButton
      classNames={{
        backdrop: "bg-black/80",
        body: "p-0",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <div className="flex items-center justify-between p-6 border-b border-divider">
          <div className="flex flex-col">
            <h3 className="text-xl font-normal text-foreground">Security Settings</h3>
            <p className="text-sm text-foreground/60">Configure your account recovery options</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              className="text-foreground/60 hover:text-foreground transition-colors"
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
            <RecoveryHeader configuredCount={configuredCount} threshold={threshold} onThresholdChange={setThreshold} />
            <Accordion
              className="p-0 gap-0 flex flex-col bg-content2 rounded-lg border border-divider"
              itemClasses={{
                base: "border-b border-divider last:border-0",
                title: "font-medium",
                trigger: "px-4 py-3 flex data-[hover=true]:bg-transparent rounded-none",
                indicator: "text-medium",
                content: "pt-0",
              }}
              showDivider={false}
              variant="light"
            >
              {RECOVERY_OPTIONS.map((option) => {
                const isConfigured =
                  option.method === "BACKPACK"
                    ? isBackpackRecoveryEnabled
                    : recoveryWallets.some((w) => w.recoveryMethod === option.method);
                return (
                  <AccordionItem
                    key={option.id}
                    aria-label={option.title}
                    classNames={{
                      base: option.isComingSoon ? "opacity-50" : isConfigured ? "bg-teal-500/10" : "",
                      content: "pt-6",
                    }}
                    isDisabled={option.isComingSoon}
                    startContent={
                      <option.icon
                        className={`w-5 h-5 ${
                          isConfigured ? "text-teal-500" : option.isComingSoon ? "text-default-300" : "text-default-500"
                        }`}
                      />
                    }
                    subtitle={<p className="text-sm text-foreground/60">{option.description}</p>}
                    title={
                      <div className="flex items-center gap-2">
                        <span className={option.isComingSoon ? "text-default-400" : ""}>{option.title}</span>
                        {option.isComingSoon && (
                          <Chip className="bg-content3 text-foreground/60" size="sm" variant="flat">
                            Coming Soon
                          </Chip>
                        )}
                        {isConfigured && (
                          <Chip className="bg-teal-500/10 text-teal-500" size="sm" variant="flat">
                            Configured
                          </Chip>
                        )}
                      </div>
                    }
                  >
                    <div className="px-4 pb-4 space-y-4">
                      {option.id === "email" && (
                        <EmailVerification
                          configuredEmails={configuredEmails}
                          currentEmail={currentEmail}
                          otpValue={otpValue}
                          verifyingEmail={verifyingEmail}
                          onAddEmail={handleAddEmail}
                          onCancelVerification={handleCancelVerification}
                          onEmailChange={setCurrentEmail}
                          onOtpChange={setOtpValue}
                          onRemoveEmail={handleRemoveEmail}
                          onVerifyOtp={handleVerifyOtp}
                        />
                      )}
                      {option.id === "phone" && (
                        <PhoneVerification
                          configuredPhone={configuredPhone}
                          currentPhone={currentPhone}
                          phoneOtpValue={phoneOtpValue}
                          verifyingPhone={verifyingPhone}
                          onAddPhone={handleAddPhone}
                          onCancelPhoneVerification={handleCancelPhoneVerification}
                          onPhoneChange={setCurrentPhone}
                          onPhoneOtpChange={setPhoneOtpValue}
                          onRemovePhone={handleRemovePhone}
                          onVerifyPhoneOtp={handleVerifyPhoneOtp}
                        />
                      )}
                      {option.id === "team" && (
                        <TeamRecovery
                          configuredTeamMember={configuredTeamMember}
                          onRemoveTeamMember={handleRemoveTeamMember}
                          onSelectTeamMember={handleSelectTeamMember}
                        />
                      )}
                      {option.id === "backpack" && (
                        <BackpackRecovery
                          isEnabled={isBackpackRecoveryEnabled}
                          onToggle={handleBackpackRecoveryToggle}
                        />
                      )}
                    </div>
                  </AccordionItem>
                );
              })}
            </Accordion>
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

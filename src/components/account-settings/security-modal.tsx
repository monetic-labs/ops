"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalBody } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { XIcon, Timer, Clock } from "lucide-react";
import { Chip } from "@nextui-org/chip";

import pylon from "@/libs/pylon-sdk";
import {
  useRecoveryWallets,
  useVerification,
  usePendingChanges,
  useEmailRecoveryHandlers,
  usePhoneRecoveryHandlers,
  useBackpackRecoveryHandlers,
} from "@/hooks/security";

import { RECOVERY_OPTIONS, DEAD_SWITCH_OPTIONS, GRACE_PERIOD_OPTIONS } from "./security/constants";

import { SecuritySettingsModalProps } from "./security/types";
import { EmailVerification } from "./security/components/recovery-options/email-verification";
import { PhoneVerification } from "./security/components/recovery-options/phone-verification";
import { BackpackRecovery } from "./security/components/recovery-options/backpack-recovery";
import { RecoveryWarning } from "./security/components/recovery-warning";
import { RecoveryHeader } from "./security/components/recovery-header";
import { TimeSettingCard } from "./security/components/time-setting-card";
import { useAccounts } from "@/contexts/AccountContext";

export const SecuritySettingsModal = ({ isOpen, onClose }: SecuritySettingsModalProps) => {
  // Time settings state
  const [selectedGracePeriod, setSelectedGracePeriod] = useState<string>("7");
  const [selectedDeadSwitch, setSelectedDeadSwitch] = useState<string>("12");
  const [threshold, setThreshold] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  // Get user context
  const { user } = useAccounts();

  // Initialize hooks
  const {
    recoveryWallets,
    configuredEmails,
    configuredPhone,
    isBackpackRecoveryEnabled,
    setConfiguredEmails,
    setConfiguredPhone,
    setIsBackpackRecoveryEnabled,
    fetchRecoveryWallets,
  } = useRecoveryWallets(isOpen);

  const { emailVerification, phoneVerification } = useVerification();

  const { pendingChanges, addPendingChange, clearPendingChanges, hasPendingChanges } = usePendingChanges();

  // Initialize handlers
  const emailHandlers = useEmailRecoveryHandlers({
    configuredEmails,
    setConfiguredEmails,
    emailVerification,
    addPendingChange,
    threshold,
    userAddress: user?.walletAddress,
  });

  const phoneHandlers = usePhoneRecoveryHandlers({
    configuredPhone,
    setConfiguredPhone,
    phoneVerification,
    addPendingChange,
    threshold,
    userAddress: user?.walletAddress,
  });

  const backpackHandlers = useBackpackRecoveryHandlers({
    isEnabled: isBackpackRecoveryEnabled,
    setIsEnabled: setIsBackpackRecoveryEnabled,
    threshold,
    userAddress: user?.walletAddress,
  });

  // Calculate configured count
  const configuredCount = recoveryWallets.length + (isBackpackRecoveryEnabled ? 1 : 0);
  const pendingConfiguredCount = configuredCount - pendingChanges.toDelete.length;

  const handleSaveSettings = async () => {
    if (!user?.walletAddress || isSaving) return;
    setIsSaving(true);

    try {
      // Generate new recovery wallets
      if (pendingChanges.toAdd.length > 0) {
        await pylon.generateRecoveryWallets(pendingChanges.toAdd);
      }

      // Delete old recovery wallets
      if (pendingChanges.toDelete.length > 0) {
        await Promise.all(pendingChanges.toDelete.map((id) => pylon.deleteRecoveryWallet(id)));
      }

      // Reset state and refresh
      clearPendingChanges();
      await fetchRecoveryWallets();
    } catch (error) {
      console.error("Failed to save security settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      hideCloseButton
      classNames={{
        backdrop: "bg-black/80",
        body: "p-0",
        base: "h-[calc(100vh-64px)]",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent className="flex flex-col h-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-divider">
          <div className="flex flex-col">
            <h3 className="text-xl font-normal text-foreground">Security Settings</h3>
            <p className="text-sm text-foreground/60">Configure your account recovery options</p>
          </div>
          <Button
            isIconOnly
            className="text-foreground/60 hover:text-foreground transition-colors"
            variant="light"
            onClick={onClose}
          >
            <XIcon size={18} />
          </Button>
        </div>

        {/* Modal Body */}
        <ModalBody className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Recovery Options Section */}
          <div className="space-y-4">
            <RecoveryWarning configuredCount={pendingConfiguredCount} />
            <RecoveryHeader
              configuredCount={pendingConfiguredCount}
              threshold={threshold}
              onThresholdChange={setThreshold}
            />

            <Accordion
              className="p-0 gap-0 flex flex-col bg-content2 rounded-lg border border-divider"
              variant="bordered"
              selectionMode="multiple"
              itemClasses={{
                base: "border-b border-divider last:border-0",
                title: "font-medium",
                trigger: "px-4 py-3 flex data-[hover=true]:bg-transparent rounded-none",
                indicator: "text-medium",
                content: "pt-0",
              }}
            >
              {RECOVERY_OPTIONS.map((option) => {
                const isConfigured =
                  option.method === "BACKPACK"
                    ? isBackpackRecoveryEnabled
                    : recoveryWallets.some(
                        (w) => w.recoveryMethod === option.method && !pendingChanges.toDelete.includes(w.id)
                      );

                const Icon = option.icon;

                return (
                  <AccordionItem
                    key={option.id}
                    aria-label={option.title}
                    classNames={{
                      base: option.isComingSoon ? "opacity-50" : isConfigured ? "bg-teal-500/10" : "",
                      content: "pt-0",
                    }}
                    isDisabled={option.isComingSoon}
                    title={
                      <div className="flex items-center gap-4">
                        <Icon
                          className={`w-5 h-5 ${
                            isConfigured
                              ? "text-teal-500"
                              : option.isComingSoon
                                ? "text-default-300"
                                : "text-default-500"
                          }`}
                        />
                        <div className="flex flex-col gap-1">
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
                          <p className="text-sm text-foreground/60">{option.description}</p>
                        </div>
                      </div>
                    }
                  >
                    <div className="px-4 pb-4">
                      {option.id === "email" && (
                        <EmailVerification
                          configuredEmails={configuredEmails}
                          currentEmail={emailVerification.currentEmail}
                          otpValue={emailVerification.otpValue}
                          verifyingEmail={emailVerification.verifyingEmail}
                          pendingDeletions={pendingChanges.toDelete}
                          onAddEmail={emailHandlers.handleAddEmail}
                          onCancelVerification={emailHandlers.handleCancelVerification}
                          onEmailChange={emailVerification.setCurrentEmail}
                          onOtpChange={emailVerification.setOtpValue}
                          onRemoveEmail={emailHandlers.handleRemoveEmail}
                          onVerifyOtp={emailHandlers.handleVerifyOtp}
                        />
                      )}
                      {option.id === "phone" && (
                        <PhoneVerification
                          configuredPhone={configuredPhone}
                          currentPhone={phoneVerification.currentPhone}
                          phoneOtpValue={phoneVerification.phoneOtpValue}
                          verifyingPhone={phoneVerification.verifyingPhone}
                          onAddPhone={phoneHandlers.handleAddPhone}
                          onCancelPhoneVerification={phoneHandlers.handleCancelPhoneVerification}
                          onPhoneChange={phoneVerification.setCurrentPhone}
                          onPhoneOtpChange={phoneVerification.setPhoneOtpValue}
                          onRemovePhone={phoneHandlers.handleRemovePhone}
                          onVerifyPhoneOtp={phoneHandlers.handleVerifyPhoneOtp}
                        />
                      )}
                      {option.id === "backpack" && (
                        <BackpackRecovery
                          isEnabled={isBackpackRecoveryEnabled}
                          onToggle={backpackHandlers.handleToggle}
                        />
                      )}
                    </div>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {/* Time Settings Section */}
          <TimeSettingCard
            title="Grace Period"
            description="The grace period adds a timelock to recovery attempts, allowing you to detect and stop any unauthorized recovery attempts."
            icon={Timer}
            options={GRACE_PERIOD_OPTIONS}
            selectedValue={selectedGracePeriod}
            onValueChange={setSelectedGracePeriod}
            isComingSoon={true}
          />

          <TimeSettingCard
            title="Dead Switch"
            description="Dead Switch automatically transfers account access to designated guardians after a period of inactivity."
            icon={Clock}
            options={DEAD_SWITCH_OPTIONS}
            selectedValue={selectedDeadSwitch}
            onValueChange={setSelectedDeadSwitch}
            isComingSoon={true}
          />
        </ModalBody>

        {/* Modal Footer */}
        <div className="border-t border-divider bg-content1/80 backdrop-blur-md p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              {hasPendingChanges && (
                <p className="text-sm text-foreground/60">You have pending changes that need to be saved</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {hasPendingChanges && (
                <Button className="text-foreground/60" size="sm" variant="light" onPress={() => clearPendingChanges()}>
                  Undo Changes
                </Button>
              )}
              <Button
                className="bg-primary text-primary-foreground"
                isDisabled={configuredCount < 3 || !hasPendingChanges || isSaving}
                isLoading={isSaving}
                size="sm"
                onPress={handleSaveSettings}
              >
                Save Security Settings
              </Button>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

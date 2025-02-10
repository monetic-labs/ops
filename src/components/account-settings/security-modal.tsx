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
import { LocalStorage } from "@/utils/localstorage";
import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnSafeAccountHelper } from "@/utils/safeAccount";
import { MetaTransaction } from "abstractionkit";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";

type RecoveryWalletGenerateInput = {
  identifier: string;
  method: RecoveryWalletMethod;
};

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

  // Set threshold to match configured count, defaulting to 2
  const [threshold, setThreshold] = useState(2);

  // Track changes that need to be synced
  const [pendingChanges, setPendingChanges] = useState<{
    toAdd: RecoveryWalletGenerateInput[];
    toDelete: string[];
    onChainTransactions: MetaTransaction[];
  }>({
    toAdd: [],
    toDelete: [],
    onChainTransactions: [],
  });

  // Calculate pending configured count
  const pendingConfiguredCount = configuredCount - pendingChanges.toDelete.length;

  useEffect(() => {
    // Update threshold when configured count changes
    if (pendingConfiguredCount > 0) {
      // If we have 3 or more options, default to 2
      if (pendingConfiguredCount >= 3) {
        setThreshold(2);
      } else {
        // Otherwise, require all options
        setThreshold(pendingConfiguredCount);
      }
    }
  }, [pendingConfiguredCount]);

  // Phone verification state
  const [configuredPhone, setConfiguredPhone] = useState<ConfiguredPhone | null>(null);
  const [currentPhone, setCurrentPhone] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState<string | null>(null);
  const [phoneOtpValue, setPhoneOtpValue] = useState("");

  // Team recovery state
  const [configuredTeamMember, setConfiguredTeamMember] = useState<OrgMember | null>(null);

  // Add state to track original configuration for undo
  const [originalState, setOriginalState] = useState<{
    emails: ConfiguredEmail[];
    phone: ConfiguredPhone | null;
    isBackpackEnabled: boolean;
  } | null>(null);

  // Add loading state
  const [isSaving, setIsSaving] = useState(false);

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
        const isBackpackGuardian = await socialRecovery.isBackpackGuardian(user?.walletAddress as `0x${string}`);
        setIsBackpackRecoveryEnabled(isBackpackGuardian);
      } catch (error) {
        console.error("Failed to check Backpack guardian status:", error);
        setIsBackpackRecoveryEnabled(false);
      }
    } catch (error) {
      console.error("Failed to fetch recovery wallets:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecoveryWallets().then(() => {
        // Store original state when modal opens
        setOriginalState({
          emails: configuredEmails,
          phone: configuredPhone,
          isBackpackEnabled: isBackpackRecoveryEnabled,
        });
      });
    }
  }, [isOpen]);

  const handleSaveSettings = async () => {
    if (!user?.walletAddress || isSaving) return;

    setIsSaving(true);
    try {
      // 1. Generate new recovery wallets first
      const newWallets = await pylon.generateRecoveryWallets(pendingChanges.toAdd);

      // 2. Prepare on-chain transactions
      const safeUser = LocalStorage.getSafeUser();
      const webauthn = new WebAuthnHelper({
        publicKey: safeUser?.publicKey,
        credentialId: safeUser?.credentialId,
      });
      const safeAccountHelper = new WebAuthnSafeAccountHelper(safeUser?.publicKey);

      // Prepare transactions array
      const transactions: MetaTransaction[] = [];

      // Add enable module transaction if needed
      if (!isBackpackRecoveryEnabled && pendingChanges.onChainTransactions.length > 0) {
        transactions.push(socialRecovery.createEnableModuleTransaction(user.walletAddress as Address));
      }

      // Add all pending transactions
      transactions.push(...pendingChanges.onChainTransactions);

      // 3. Execute on-chain transactions
      const userOp = await safeAccountHelper.createSponsoredUserOp(transactions);
      const userOpHash = safeAccountHelper.getUserOpHash(userOp);
      const signature = await webauthn.signMessage(userOpHash);
      await safeAccountHelper.signAndSendUserOp(userOp, signature);

      // 4. After on-chain success, delete old recovery wallets
      await Promise.all(pendingChanges.toDelete.map((id) => pylon.deleteRecoveryWallet(id)));

      // 5. Reset state and refresh
      setPendingChanges({
        toAdd: [],
        toDelete: [],
        onChainTransactions: [],
      });

      // Refresh the recovery wallets list
      await fetchRecoveryWallets();
    } catch (error) {
      console.error("Failed to save security settings:", error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEmail = (email: string) => {
    if (!email || configuredEmails.some((e) => e.email === email)) return;

    const newEmail = { email, isVerified: false };
    setConfiguredEmails((prev) => [...prev, newEmail]);
    setVerifyingEmail(email);
    setCurrentEmail("");

    // Track the change
    setPendingChanges((prev) => ({
      ...prev,
      toAdd: [
        ...prev.toAdd,
        {
          identifier: email,
          method: RecoveryWalletMethod.EMAIL,
        },
      ],
    }));
  };

  const handleVerifyOtp = async () => {
    if (!verifyingEmail || !user?.walletAddress) return;

    try {
      // Here you would typically verify the OTP with your API
      setConfiguredEmails((prev) =>
        prev.map((email) => (email.email === verifyingEmail ? { ...email, isVerified: true } : email))
      );

      // Generate recovery wallet address for the email
      const newWallets = await pylon.generateRecoveryWallets([
        {
          identifier: verifyingEmail,
          method: RecoveryWalletMethod.EMAIL,
        },
      ]);

      if (newWallets && newWallets[0]) {
        // Add on-chain transaction to add guardian
        setPendingChanges((prev) => ({
          ...prev,
          onChainTransactions: [
            ...prev.onChainTransactions,
            socialRecovery.createAddGuardianTransaction(newWallets[0].publicAddress as Address, BigInt(threshold)),
          ],
        }));
      }

      setVerifyingEmail(null);
      setOtpValue("");
    } catch (error) {
      console.error("Failed to verify email:", error);
      // TODO: Show error toast
    }
  };

  const handleCancelVerification = () => {
    if (!verifyingEmail) return;

    setConfiguredEmails((prev) => prev.filter((email) => email.email !== verifyingEmail));
    setVerifyingEmail(null);
    setOtpValue("");
  };

  const handleRemoveEmail = (email: string) => {
    const emailToRemove = configuredEmails.find((e) => e.email === email);
    if (!emailToRemove?.recoveryWalletId) return;

    // Track the change
    setPendingChanges((prev) => ({
      ...prev,
      toDelete: [...prev.toDelete, emailToRemove.recoveryWalletId as string],
    }));

    // Don't actually remove the email from the list until changes are saved
    if (verifyingEmail === email) {
      setVerifyingEmail(null);
      setOtpValue("");
    }
  };

  const handleBackpackRecoveryToggle = async () => {
    if (!user?.walletAddress) return;

    try {
      const safeUser = LocalStorage.getSafeUser();
      const webauthn = new WebAuthnHelper({
        publicKey: safeUser?.publicKey,
        credentialId: safeUser?.passkeyId,
      });
      const safeAccountHelper = new WebAuthnSafeAccountHelper(safeUser?.publicKeyCoordinates);

      if (!isBackpackRecoveryEnabled) {
        // Enable Backpack as guardian
        const enableModuleTx = socialRecovery.createEnableModuleTransaction(user.walletAddress as `0x${string}`);
        const addGuardianTx = socialRecovery.createAddGuardianTransaction(
          BACKPACK_GUARDIAN_ADDRESS as `0x${string}`,
          BigInt(threshold)
        );

        const userOp = await safeAccountHelper.createSponsoredUserOp([enableModuleTx, addGuardianTx]);
        const userOpHash = safeAccountHelper.getUserOpHash(userOp);
        const signature = await webauthn.signMessage(userOpHash);
        await safeAccountHelper.signAndSendUserOp(userOp, signature);
      } else {
        // Disable Backpack as guardian
        const revokeGuardianTx = await socialRecovery.createRevokeGuardianTransaction(
          user.walletAddress as `0x${string}`,
          BACKPACK_GUARDIAN_ADDRESS as `0x${string}`,
          BigInt(threshold)
        );

        const userOp = await safeAccountHelper.createSponsoredUserOp([revokeGuardianTx]);
        const userOpHash = safeAccountHelper.getUserOpHash(userOp);
        const signature = await webauthn.signMessage(userOpHash);
        await safeAccountHelper.signAndSendUserOp(userOp, signature);
      }

      setIsBackpackRecoveryEnabled((prev) => !prev);
    } catch (error) {
      console.error("Failed to toggle Backpack recovery:", error);
      // TODO: Show error toast
    }
  };

  // Phone handlers
  const handleAddPhone = (phone: string) => {
    if (!phone || configuredPhone) return;

    setConfiguredPhone({ number: phone, isVerified: false });
    setVerifyingPhone(phone);
    setCurrentPhone("");
  };

  const handleVerifyPhoneOtp = async () => {
    if (!verifyingPhone || !configuredPhone || !user?.walletAddress) return;

    try {
      // Here you would typically verify the OTP with your API
      setConfiguredPhone({ ...configuredPhone, isVerified: true });

      // Generate recovery wallet address for the phone
      const newWallets = await pylon.generateRecoveryWallets([
        {
          identifier: verifyingPhone,
          method: RecoveryWalletMethod.PHONE,
        },
      ]);

      if (newWallets && newWallets[0]) {
        // Add on-chain transaction to add guardian
        setPendingChanges((prev) => ({
          ...prev,
          onChainTransactions: [
            ...prev.onChainTransactions,
            socialRecovery.createAddGuardianTransaction(newWallets[0].publicAddress as Address, BigInt(threshold)),
          ],
        }));
      }

      setVerifyingPhone(null);
      setPhoneOtpValue("");
    } catch (error) {
      console.error("Failed to verify phone:", error);
      // TODO: Show error toast
    }
  };

  const handleCancelPhoneVerification = () => {
    if (!verifyingPhone) return;

    setConfiguredPhone(null);
    setVerifyingPhone(null);
    setPhoneOtpValue("");
  };

  const handleRemovePhone = () => {
    if (!configuredPhone?.recoveryWalletId) return;

    const phoneId = configuredPhone.recoveryWalletId;

    // Track the change
    setPendingChanges((prev) => ({
      ...prev,
      toDelete: [...prev.toDelete, phoneId] as string[],
    }));

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

  const handleUndoChanges = () => {
    if (!originalState) return;

    // Restore original state
    setConfiguredEmails(originalState.emails);
    setConfiguredPhone(originalState.phone);
    setIsBackpackRecoveryEnabled(originalState.isBackpackEnabled);

    // Clear verification states
    setVerifyingEmail(null);
    setOtpValue("");
    setVerifyingPhone(null);
    setPhoneOtpValue("");
    setCurrentEmail("");
    setCurrentPhone("");

    // Clear pending changes
    setPendingChanges({
      toAdd: [],
      toDelete: [],
      onChainTransactions: [],
    });

    // Restore recovery wallets to match original state
    const originalWallets = [
      ...originalState.emails.map((email) => ({
        id: email.recoveryWalletId || "",
        identifier: email.email,
        recoveryMethod: RecoveryWalletMethod.EMAIL,
      })),
      ...(originalState.phone
        ? [
            {
              id: originalState.phone.recoveryWalletId || "",
              identifier: originalState.phone.number,
              recoveryMethod: RecoveryWalletMethod.PHONE,
            },
          ]
        : []),
    ].filter((wallet) => wallet.id);

    setRecoveryWallets(originalWallets as RecoveryWallet[]);

    // Reset threshold to match original configuration
    const originalConfigCount =
      originalState.emails.length + (originalState.phone ? 1 : 0) + (originalState.isBackpackEnabled ? 1 : 0);

    if (originalConfigCount >= 3) {
      setThreshold(2);
    } else if (originalConfigCount > 0) {
      setThreshold(originalConfigCount);
    }
  };

  const hasPendingChanges =
    pendingChanges.toAdd.length > 0 ||
    pendingChanges.toDelete.length > 0 ||
    pendingChanges.onChainTransactions.length > 0;

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
                    : option.method === "EMAIL"
                      ? recoveryWallets
                          .filter((w) => w.recoveryMethod === option.method)
                          .some((w) => !pendingChanges.toDelete.includes(w.id))
                      : option.method === "PHONE"
                        ? recoveryWallets
                            .filter((w) => w.recoveryMethod === option.method)
                            .some((w) => !pendingChanges.toDelete.includes(w.id))
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
                          pendingDeletions={pendingChanges.toDelete}
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
                <Button className="text-foreground/60" size="sm" variant="light" onPress={handleUndoChanges}>
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

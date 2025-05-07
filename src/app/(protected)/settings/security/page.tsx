"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import {
  AlertTriangle,
  Clock,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  CheckCircle,
  AlertCircle,
  Mail,
  Smartphone,
  Users,
  Key,
  Building,
  Trash2,
  Info,
} from "lucide-react";
import { Spinner } from "@heroui/spinner";
import { useUser } from "@/contexts/UserContext";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";
import { TransferStatus } from "@/components/generics/transfer-status";
import { Chip } from "@heroui/chip";
import { GRACE_PERIOD_OPTIONS, DEAD_SWITCH_OPTIONS } from "@/app/(protected)/settings/security/constants";
import { PendingChanges } from "@/app/(protected)/settings/security/types";
import { RecoveryWalletMethod } from "@monetic-labs/sdk";
import { useSecuritySettingsManager } from "./_hooks/useSecuritySettingsManager";
import { useRecoveryWallets } from "./_hooks/useRecoveryWallets";
import { usePasskeyManager } from "./_hooks/usePasskeyManager";
import SecuritySettingCard from "./_components/SecuritySettingCard";
import TimeSelector from "./_components/TimeSelector";
import RecoveryMethodItem from "./_components/RecoveryMethodItem";
import StatusAlert from "./_components/StatusAlert";
import SummaryStatusItem from "./_components/SummaryStatusItem";
import RecoveryRequestModal from "./_components/RecoveryRequestModal";
import PasskeyManagementSection from "./_components/PasskeyManagementSection";
import { Passkey } from "@/utils/safe/features/passkey";

export default function SecuritySettingsPage() {
  // Component State
  const [threshold, setThreshold] = useState(1);
  const [isSettingsValid, setIsSettingsValid] = useState(false);
  const [recoveryDelay, setRecoveryDelay] = useState("7");
  const [transactionDelay, setTransactionDelay] = useState("12");
  const [showLegacyBanner, setShowLegacyBanner] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // User Context
  const { user, isLoading: isUserLoading } = useUser();
  const { selectCredential } = usePasskeySelection();

  // --- Check for wallet address ---
  const hasWalletAddress = !!user?.walletAddress;

  // Recovery Wallets Hook (conditionally initialized)
  const {
    recoveryWallets,
    isMoneticRecoveryEnabled,
    isModuleInstalled,
    currentThreshold,
    setIsMoneticRecoveryEnabled,
    fetchRecoveryWallets,
    // Conditionally provide initial values if no wallet
  } = useRecoveryWallets(hasWalletAddress); // Pass hasWalletAddress

  // Pending Changes State
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    toAdd: [],
    toDelete: [],
    toggleMonetic: false,
  });

  // Pending Changes Helpers
  const clearPendingChanges = () => {
    setPendingChanges({
      toAdd: [],
      toDelete: [],
      toggleMonetic: false,
    });
  };

  // Function to add a legacy wallet ID for removal
  const addLegacyWalletForRemoval = (walletId: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      toDelete: Array.from(new Set([...prev.toDelete, walletId])),
    }));
  };

  // Function to cancel removal of a legacy wallet
  const cancelLegacyWalletRemoval = (walletId: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      toDelete: prev.toDelete.filter((id) => id !== walletId),
    }));
  };

  // Calculate derived values (handle no wallet address case)
  const currentTotalGuardians = hasWalletAddress ? (isMoneticRecoveryEnabled ? 1 : 0) + recoveryWallets.length : 0;
  const pendingGuardiansToRemoveCount = pendingChanges.toDelete.length;
  const pendingMoneticChange = pendingChanges.toggleMonetic ? (isMoneticRecoveryEnabled ? -1 : 1) : 0;
  const pendingTotalGuardians = hasWalletAddress
    ? currentTotalGuardians - pendingGuardiansToRemoveCount + pendingMoneticChange
    : 0;

  // --- Calculate hasPendingChanges (after other calculations) ---
  const hasPendingChanges =
    hasWalletAddress && // Can only have pending changes if a wallet exists
    (pendingChanges.toggleMonetic ||
      pendingChanges.toDelete.length > 0 ||
      (isModuleInstalled && threshold !== currentThreshold));

  // Effect to set initial/correct threshold (handle no wallet)
  useEffect(() => {
    if (hasWalletAddress && isModuleInstalled && currentThreshold > 0) {
      setThreshold(currentThreshold);
    } else {
      setThreshold(pendingTotalGuardians > 0 ? 1 : 0);
    }
  }, [hasWalletAddress, isModuleInstalled, currentThreshold, pendingTotalGuardians]);

  // Effect to validate settings (handle no wallet)
  useEffect(() => {
    if (!hasWalletAddress) {
      setIsSettingsValid(false); // Cannot be valid without a wallet
      return;
    }
    const isValid = pendingTotalGuardians > 0 && threshold > 0 && threshold <= pendingTotalGuardians;
    setIsSettingsValid(isValid);

    // Threshold adjustments...
    if (pendingTotalGuardians === 1 && threshold !== 1) {
      setThreshold(1);
    } else if (pendingTotalGuardians > 1 && threshold > pendingTotalGuardians) {
      setThreshold(pendingTotalGuardians);
    } else if (pendingTotalGuardians > 0 && threshold === 0) {
      setThreshold(1);
    } else if (pendingTotalGuardians === 0 && threshold !== 0) {
      setThreshold(0);
    }
  }, [hasWalletAddress, pendingTotalGuardians, threshold]);

  // Effect to check for legacy wallets and show banner
  useEffect(() => {
    if (recoveryWallets && recoveryWallets.length > 0) {
      const hasActiveLegacy = recoveryWallets.some((wallet) => !pendingChanges.toDelete.includes(wallet.id));
      setShowLegacyBanner(hasActiveLegacy);
    } else {
      setShowLegacyBanner(false);
    }
  }, [recoveryWallets, pendingChanges.toDelete]);

  // Action Handler for Monetic Toggle (guard against no wallet)
  const handleToggleMonetic = async () => {
    if (!hasWalletAddress) return;
    try {
      await selectCredential().catch((error) => {
        throw new Error("Passkey selection canceled by user.");
      });
      const currentBlockchainState = isMoneticRecoveryEnabled;
      const targetUIState = !currentBlockchainState;

      setIsMoneticRecoveryEnabled(targetUIState);

      setPendingChanges((prev) => ({ ...prev, toggleMonetic: !prev.toggleMonetic }));
    } catch (error) {
      console.error("Failed to initiate Monetic toggle:", error);
    }
  };

  // Security Settings Manager Hook (conditionally initialized)
  const { isSaving, status, saveSettings } = useSecuritySettingsManager({
    user,
    pendingChanges,
    threshold,
    currentThreshold: hasWalletAddress ? currentThreshold : 0,
    isMoneticRecoveryEnabled:
      (isMoneticRecoveryEnabled && !pendingChanges.toggleMonetic) ||
      (!isMoneticRecoveryEnabled && pendingChanges.toggleMonetic),
    recoveryWallets,
    fetchRecoveryWallets,
    clearPendingChanges,
  });

  // Passkey Manager Hook
  const {
    passkeys,
    isLoading: isPasskeyLoading,
    isAddingPasskey,
    isProcessingPasskey,
    addPasskey,
    activatePasskey,
    renamePasskey,
    removePasskey,
  } = usePasskeyManager({ user });

  // The passkeys from usePasskeyManager are already Passkey[] with non-optional id.
  // The filter `pk.id === "string"` is technically redundant if the type contract is upheld,
  // but doesn't hurt as a runtime sanity check if there's any doubt about data sources upstream.
  // For clean typing, if `passkeys` is `Passkey[]`, `id` is guaranteed.
  // Let's assume `passkeys` from the hook correctly implements `Passkey[]`
  const listTableItems: Passkey[] = passkeys; // No filtering needed if type is correct from hook

  // Loading State
  if (isUserLoading || (isPasskeyLoading && passkeys.length === 0 && !hasWalletAddress)) {
    // Adjust loading condition
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="primary" label="Loading security settings..." />
      </div>
    );
  }

  // Helper: Get status badge color based on *pending* count
  const getStatusBadgeColor = (count: number) => {
    if (count === 0) return "warning";
    if (count === 1) return "success";
    return "primary";
  };

  // Render operation status message
  const renderStatusMessage = () => {
    switch (status) {
      case TransferStatus.SIGNING:
        return (
          <div className="flex items-center gap-1.5 text-warning">
            <Clock className="w-4 h-4" />
            <span>Waiting for signature...</span>
          </div>
        );
      case TransferStatus.SENDING:
      case TransferStatus.PREPARING:
      case TransferStatus.CONFIRMING:
        return (
          <div className="flex items-center gap-1.5 text-primary">
            <Spinner size="sm" />
            <span>Processing transaction...</span>
          </div>
        );
      case TransferStatus.SENT:
        return (
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        );
      case TransferStatus.ERROR:
        return (
          <div className="flex items-center gap-1.5 text-danger">
            <XCircle className="w-4 h-4" />
            <span>Failed to save settings</span>
          </div>
        );
      default:
        return null;
    }
  };

  const openRecoveryModal = () => {
    setIsRecoveryModalOpen(true);
  };

  const closeRecoveryModal = () => {
    setIsRecoveryModalOpen(false);
  };

  // Render Page Content
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Security Settings</h1>
        <p className="text-foreground-500 mt-1">Manage authentication, recovery, and other security options.</p>
      </div>

      {/* --- Wallet Setup Prompt --- */}
      {!hasWalletAddress && !isUserLoading && (
        <div className="p-4 border border-primary/30 bg-primary-50 dark:bg-content2 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-primary-700 dark:text-white">
                Get Started with Secure Authentication
              </h3>
              <p className="text-xs text-primary-600 dark:text-white mt-1">
                Add your first passkey below to create your secure wallet address and enable advanced security settings
                like recovery options.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Passkeys Section (Always visible) - Now uses the dedicated component */}
      <PasskeyManagementSection
        passkeys={listTableItems}
        isLoading={isPasskeyLoading}
        isAddingPasskey={isAddingPasskey}
        isProcessingPasskey={isProcessingPasskey}
        user={user}
        onAddPasskey={addPasskey}
        onActivatePasskey={activatePasskey}
        onRenamePasskey={renamePasskey}
        onRemovePasskey={removePasskey}
      />

      {/* Legacy Wallet Banner (Conditional) */}
      {hasWalletAddress && showLegacyBanner && (
        <div className="p-4 border border-warning/30 bg-warning-50 dark:bg-warning/10 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-warning-700 dark:text-warning-300">
                Legacy Recovery Methods Detected
              </h3>
              <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                Your account currently uses older recovery methods (Email/Phone). These methods are being phased out.
                Please review the &quot;Legacy Recovery Methods&quot; section below and save your changes to remove
                them. Ensure Monetic Recovery is active before removing all legacy methods.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Status/Warning Messages (Conditional) */}
      {hasWalletAddress && status !== TransferStatus.IDLE && (
        <div
          className={`p-4 border rounded-lg ${
            status === TransferStatus.ERROR
              ? "border-danger/30 bg-danger-50 dark:bg-danger/10"
              : status === TransferStatus.SENT
                ? "border-success/30 bg-success-50 dark:bg-success/10"
                : "border-primary/30 bg-primary-50 dark:bg-primary/10"
          }`}
        >
          <div className="flex items-start gap-3">
            {status === TransferStatus.ERROR ? (
              <AlertTriangle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
            ) : status === TransferStatus.SENT ? (
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            ) : (
              <Spinner size="sm" color="primary" className="mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-grow">{renderStatusMessage()}</div>
          </div>
        </div>
      )}

      {/* Recovery Options Card (Disabled if no wallet) */}
      <div className={!hasWalletAddress ? "opacity-50 pointer-events-none" : ""}>
        <SecuritySettingCard
          title="Recovery Options"
          description="Configure methods to recover your account if you lose access"
          icon={Shield}
          headerClassName="pb-0"
          bodyClassName="pt-4 space-y-4"
        >
          {/* Configuration Status Messages */}
          {pendingTotalGuardians === 0 ? (
            <StatusAlert type="warning" message="Enable Monetic Recovery below to protect your account." />
          ) : pendingTotalGuardians === 1 ? (
            <StatusAlert
              type="success"
              message="Account recovery is configured with Monetic. Consider adding more methods when available."
            />
          ) : threshold === 1 ? (
            <StatusAlert
              type="warning"
              message={`Recovery requires any 1 of ${pendingTotalGuardians} methods. Consider increasing the threshold.`}
            />
          ) : (
            <StatusAlert
              type="success"
              message={`Recovery requires ${threshold} of ${pendingTotalGuardians} methods.`}
            />
          )}

          {/* Moved Summary Status Items Here */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 py-4 border-y border-divider">
            <SummaryStatusItem
              label="Recovery Methods"
              value={pendingTotalGuardians}
              description={
                pendingTotalGuardians === 0
                  ? "None configured"
                  : `${pendingTotalGuardians} method${pendingTotalGuardians > 1 ? "s" : ""} active`
              }
              chipColor={getStatusBadgeColor(pendingTotalGuardians)}
            />
            <SummaryStatusItem
              label="Threshold Required"
              value={pendingTotalGuardians === 0 ? "-" : `${threshold} of ${pendingTotalGuardians}`}
              description={
                pendingTotalGuardians === 0
                  ? "Configure recovery methods first"
                  : pendingTotalGuardians === 1
                    ? "Single method required"
                    : threshold === 1
                      ? "Low security: Any method can recover"
                      : threshold === pendingTotalGuardians
                        ? "High security: All methods needed"
                        : "Medium security"
              }
              chipColor={
                pendingTotalGuardians === 0
                  ? "default"
                  : pendingTotalGuardians === 1
                    ? "success"
                    : threshold === 1
                      ? "warning"
                      : threshold === pendingTotalGuardians
                        ? "success"
                        : "primary"
              }
            />
            <SummaryStatusItem
              label="Module Status"
              value={isModuleInstalled ? "Installed" : "Not Installed"}
              description={isModuleInstalled ? "Recovery module is active" : "Will be installed on save"}
              chipColor={isModuleInstalled ? "success" : "warning"}
            />
          </div>

          {/* Monetic Recovery Section */}
          <RecoveryMethodItem
            title="Monetic Recovery"
            description="Allow Monetic to help recover your account"
            icon={Building}
            isActive={isMoneticRecoveryEnabled}
            statusLabel={isMoneticRecoveryEnabled ? "Active" : "Not Set"}
            defaultOpen={true}
            isMoneticRecovery={true}
            isMoneticRecoveryEnabled={isMoneticRecoveryEnabled}
            handleToggleMonetic={handleToggleMonetic}
            isPendingToggle={pendingChanges.toggleMonetic}
            disableToggle={true}
            onManualRecoveryRequest={openRecoveryModal}
          />

          {/* Legacy Recovery Methods Section */}
          {recoveryWallets.length > 0 && (
            <div className="pt-4 mt-4 border-t border-divider">
              <h3 className="text-sm font-medium text-foreground-600 mb-3">Legacy Recovery Methods</h3>
              {recoveryWallets.map((wallet) => {
                const isPendingRemoval = pendingChanges.toDelete.includes(wallet.id);
                const getIcon = (method: string | RecoveryWalletMethod) => {
                  switch (method) {
                    case RecoveryWalletMethod.EMAIL:
                      return Mail;
                    case RecoveryWalletMethod.PHONE:
                      return Smartphone;
                    default:
                      return AlertCircle;
                  }
                };
                return (
                  <RecoveryMethodItem
                    key={wallet.id}
                    title={
                      wallet.recoveryMethod === ("UNKNOWN" as any)
                        ? "Unknown Guardian"
                        : `${wallet.recoveryMethod} Recovery`
                    }
                    description={wallet.identifier}
                    icon={getIcon(wallet.recoveryMethod)}
                    isActive={true}
                    statusLabel={isPendingRemoval ? "Pending Removal" : "Active (Legacy)"}
                    chipColor={isPendingRemoval ? "warning" : "default"}
                    disableCollapse={true}
                  >
                    <div className="mt-2">
                      {!isPendingRemoval ? (
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          startContent={<Trash2 className="w-3.5 h-3.5" />}
                          onPress={() => addLegacyWalletForRemoval(wallet.id)}
                        >
                          Mark for Removal
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="flat"
                          color="default"
                          onPress={() => cancelLegacyWalletRemoval(wallet.id)}
                        >
                          Cancel Removal
                        </Button>
                      )}
                    </div>
                  </RecoveryMethodItem>
                );
              })}
            </div>
          )}

          {/* Additional Recovery Methods (Coming Soon) */}
          <RecoveryMethodItem
            title="Email Recovery"
            description="Use your email address to recover access"
            icon={Mail}
            isComingSoon={true}
            disableCollapse={true}
          />

          <RecoveryMethodItem
            title="Phone Recovery"
            description="Use your phone number to recover access"
            icon={Smartphone}
            isComingSoon={true}
            disableCollapse={true}
          />

          <RecoveryMethodItem
            title="Trusted Contacts"
            description="Designate friends or family to help recover access"
            icon={Users}
            isComingSoon={true}
            disableCollapse={true}
          />

          <RecoveryMethodItem
            title="Hardware Key"
            description="Use a hardware security key for recovery"
            icon={Key}
            isComingSoon={true}
            disableCollapse={true}
          />

          {/* Save Changes Section (Conditionally render/disable) */}
          {hasPendingChanges && (
            <div className="mt-6 pt-4 border-t border-divider">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-grow min-w-0">{renderStatusMessage()}</div>
                <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                  <Button
                    variant="bordered"
                    color="danger"
                    onPress={clearPendingChanges}
                    size="sm"
                    className="flex-grow sm:flex-grow-0"
                    isDisabled={isSaving} // Disable discard when saving
                  >
                    Discard Changes
                  </Button>
                  <Button
                    color="primary"
                    isDisabled={!isSettingsValid || isSaving}
                    isLoading={isSaving}
                    onPress={saveSettings}
                    size="sm"
                    startContent={<CheckCircle className="w-4 h-4" />}
                    className="flex-grow sm:flex-grow-0"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
              {!isSettingsValid && pendingTotalGuardians > 0 && (
                <p className="text-xs text-danger mt-2 text-center sm:text-right">
                  Cannot save: The selected threshold ({threshold}) is invalid for {pendingTotalGuardians} recovery
                  method(s).
                </p>
              )}
              {!isSettingsValid && pendingTotalGuardians === 0 && hasPendingChanges && (
                <p className="text-xs text-danger mt-2 text-center sm:text-right">
                  Cannot save: You must have at least one recovery method (Monetic Recovery) enabled.
                </p>
              )}
            </div>
          )}
        </SecuritySettingCard>
      </div>

      {/* Time Settings Section (Disabled if no wallet) */}
      <div className={`space-y-6 mt-8 ${!hasWalletAddress ? "opacity-50 pointer-events-none" : ""}`}>
        <SecuritySettingCard
          title="Recovery Grace Period"
          description="Set how long the recovery process will take. This gives you time to cancel if someone tries to recover your account without permission."
          icon={Clock}
          statusChip={
            <Chip size="sm" variant="flat" className="bg-content3 text-foreground/60">
              Coming Soon
            </Chip>
          }
          bodyClassName="pt-4"
        >
          <TimeSelector
            label="Recovery Grace Period"
            options={GRACE_PERIOD_OPTIONS}
            selectedValue={recoveryDelay}
            onValueChange={setRecoveryDelay}
            isDisabled={true} // Keep inner component disabled
          />
        </SecuritySettingCard>

        <SecuritySettingCard
          title="Dead Switch (Inactivity Protection)"
          description="Automatically transfer assets to a backup wallet after a period of inactivity."
          icon={ShieldAlert}
          statusChip={
            <Chip size="sm" variant="flat" className="bg-content3 text-foreground/60">
              Coming Soon
            </Chip>
          }
          bodyClassName="pt-4"
        >
          <TimeSelector
            label="Dead Switch Period"
            options={DEAD_SWITCH_OPTIONS}
            selectedValue={transactionDelay}
            onValueChange={setTransactionDelay}
            isDisabled={true} // Keep inner component disabled
          />
        </SecuritySettingCard>
      </div>

      {/* Recovery Request Modal - Now uses the component */}
      <RecoveryRequestModal isOpen={isRecoveryModalOpen} onClose={closeRecoveryModal} />
    </div>
  );
}

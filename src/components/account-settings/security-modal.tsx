"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { XIcon, AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { Address } from "viem";
import { MetaTransaction } from "abstractionkit";
import { RecoveryWalletMethod } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";
import { useRecoveryWallets } from "@/hooks/security/useRecoveryWallets";
import { useUser } from "@/contexts/UserContext";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";
import {
  createEnableModuleTransaction,
  defaultSocialRecoveryModule,
  setupSocialRecovery,
  toggleBackpackRecovery,
  addRecoveryMethod,
  removeRecoveryMethod,
  isBackpackGuardian,
} from "@/utils/safe/features/recovery";
import { executeDirectTransaction } from "@/utils/safe/flows/direct";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";

import { TransferStatus } from "../generics/transfer-status";

import { RECOVERY_OPTIONS, GRACE_PERIOD_OPTIONS, DEAD_SWITCH_OPTIONS } from "./security/constants";
import { PendingChanges, RecoveryMethod } from "./security/types";
import {
  RecoverySection,
  EmailRecovery,
  PhoneRecovery,
  BackpackRecovery,
} from "./security/components/recovery-options";
import { RecoveryHeader } from "./security/components/recovery-header";
import { RecoveryWarning } from "./security/components/recovery-warning";
import { TimeSettingCard } from "./security/components/time-setting-card";

export const SecuritySettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  // State management
  const [expandedSection, setExpandedSection] = useState<string | null>("email");
  const [threshold, setThreshold] = useState(2);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(TransferStatus.IDLE);
  const [isSettingsValid, setIsSettingsValid] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  // Add state for time settings
  const [recoveryDelay, setRecoveryDelay] = useState("7");
  const [transactionDelay, setTransactionDelay] = useState("12");

  // User context
  const { user } = useUser();
  const { selectCredential } = usePasskeySelection();

  // Recovery wallets hook - kept as external due to complexity and reusability
  const {
    recoveryWallets,
    configuredEmails,
    configuredPhone,
    isBackpackRecoveryEnabled,
    isModuleInstalled,
    currentThreshold,
    setConfiguredEmails,
    setConfiguredPhone,
    setIsBackpackRecoveryEnabled,
    fetchRecoveryWallets,
  } = useRecoveryWallets(isOpen);

  // Display a debug message when we have a status mismatch
  useEffect(() => {
    const checkBackpackStatus = async () => {
      if (user?.walletAddress && isOpen) {
        try {
          // Direct check against blockchain
          const directStatus = await isBackpackGuardian(user.walletAddress as Address);

          // Log only when there's a mismatch
          if (directStatus !== isBackpackRecoveryEnabled) {
            console.warn("🚨 Guardian status mismatch:", {
              ui: isBackpackRecoveryEnabled,
              blockchain: directStatus,
            });
          }
        } catch (error) {
          console.error("❌ Error checking guardian status:", error);
        }
      }
    };

    checkBackpackStatus();
  }, [user?.walletAddress, isBackpackRecoveryEnabled, isOpen]);

  // Integrated pendingChanges state (previously in usePendingChanges hook)
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    toAdd: [],
    toDelete: [],
    toggleBackpack: false,
  });

  // Helper functions for pending changes
  const addPendingChange = (change: Partial<PendingChanges>) => {
    setPendingChanges((prev) => ({
      ...prev,
      toAdd: [...(prev.toAdd || []), ...(change.toAdd || [])],
      toDelete: [...(prev.toDelete || []), ...(change.toDelete || [])],
      toggleBackpack: change.toggleBackpack !== undefined ? change.toggleBackpack : prev.toggleBackpack,
    }));
  };

  const clearPendingChanges = () => {
    setPendingChanges({
      toAdd: [],
      toDelete: [],
      toggleBackpack: false,
    });
  };

  const hasPendingChanges =
    pendingChanges.toAdd.length > 0 || pendingChanges.toDelete.length > 0 || pendingChanges.toggleBackpack;

  // Calculate configured count - current guardians plus pending changes
  const configuredCount = configuredEmails.length + (configuredPhone ? 1 : 0) + (isBackpackRecoveryEnabled ? 1 : 0);

  // Updated calculation to prevent double counting
  const pendingConfiguredCount =
    configuredCount -
    pendingChanges.toDelete.length +
    // Only count Backpack if it's being enabled and not already enabled
    (!isBackpackRecoveryEnabled && pendingChanges.toggleBackpack ? 1 : 0);

  // Set threshold based on currentThreshold from the module or proper defaults
  useEffect(() => {
    if (currentThreshold > 0) {
      // If module is installed and we have a threshold, use it
      setThreshold(currentThreshold);
    } else {
      // Otherwise, set defaults based on configured count
      const totalGuardians = recoveryWallets.length + (isBackpackRecoveryEnabled ? 1 : 0);

      if (totalGuardians >= 3) {
        // With 3+ guardians, default to 2
        setThreshold(2);
      } else if (totalGuardians === 2) {
        // With exactly 2 guardians, require both
        setThreshold(2);
      } else if (totalGuardians === 1) {
        // With 1 guardian, require it
        setThreshold(1);
      } else {
        // Default for no guardians yet
        setThreshold(2);
      }
    }
  }, [currentThreshold, recoveryWallets.length, isBackpackRecoveryEnabled]);

  // Validate settings
  useEffect(() => {
    const isValid = pendingConfiguredCount > 0 && threshold <= pendingConfiguredCount;

    setIsSettingsValid(isValid);

    // Adjust threshold if it exceeds the number of recovery methods
    if (threshold > pendingConfiguredCount && pendingConfiguredCount > 0) {
      setThreshold(pendingConfiguredCount);
    }
  }, [configuredEmails, configuredPhone, isBackpackRecoveryEnabled, pendingChanges, threshold, pendingConfiguredCount]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // SIMPLIFIED: Add email directly without verification
  const handleAddEmail = async () => {
    if (!emailInput || emailInput.trim() === "" || configuredEmails.some((e) => e.email === emailInput)) return;

    try {
      // Get credentials for authentication if needed
      await selectCredential().catch((error) => {
        console.error("❌ Passkey selection canceled:", error);
        throw new Error("Passkey selection was canceled");
      });

      const email = emailInput.trim();

      // Add to UI state as if already verified
      const newEmail = { email, isVerified: true };

      setConfiguredEmails((prev) => [...prev, newEmail]);

      // Add to pending changes for blockchain transaction
      addPendingChange({
        toAdd: [
          {
            identifier: email,
            method: RecoveryWalletMethod.EMAIL,
          },
        ],
      });

      // Reset input
      setEmailInput("");
    } catch (error) {
      console.error("❌ Failed to add email:", error);
    }
  };

  // SIMPLIFIED: Integrated email removal handler
  const handleRemoveEmail = async (email: string) => {
    try {
      // Get credentials for authentication if needed
      await selectCredential().catch((error) => {
        console.error("❌ Passkey selection canceled:", error);
        throw new Error("Passkey selection was canceled");
      });

      const emailToRemove = configuredEmails.find((e) => e.email === email);

      if (!emailToRemove?.recoveryWalletId) return;

      addPendingChange({
        toDelete: [emailToRemove.recoveryWalletId],
      });
    } catch (error) {
      console.error("❌ Failed to remove email:", error);
    }
  };

  // SIMPLIFIED: Add phone directly without verification
  const handleAddPhone = async () => {
    if (!phoneInput || phoneInput.trim() === "") return;

    try {
      // Get credentials for authentication if needed
      await selectCredential().catch((error) => {
        console.error("❌ Passkey selection canceled:", error);
        throw new Error("Passkey selection was canceled");
      });

      // Process the phone number - clean digits only
      const digits = phoneInput.replace(/\D/g, "");

      // Ensure phone number starts with country code 1
      const fullPhone = digits.startsWith("1") ? `1${digits.substring(1)}` : `1${digits}`;

      // Skip if phone already exists
      if (configuredPhone && configuredPhone.number === fullPhone) return;

      // Add to UI state as if already verified
      setConfiguredPhone({ number: fullPhone, isVerified: true });

      // Add to pending changes for blockchain transaction
      addPendingChange({
        toAdd: [
          {
            identifier: fullPhone,
            method: RecoveryWalletMethod.PHONE,
          },
        ],
      });

      // Reset input
      setPhoneInput("");
    } catch (error) {
      console.error("❌ Failed to add phone:", error);
    }
  };

  // SIMPLIFIED: Integrated phone removal handler
  const handleRemovePhone = async () => {
    try {
      // Get credentials for authentication if needed
      await selectCredential().catch((error) => {
        console.error("❌ Passkey selection canceled:", error);
        throw new Error("Passkey selection was canceled");
      });

      if (!configuredPhone?.recoveryWalletId) return;

      addPendingChange({
        toDelete: [configuredPhone.recoveryWalletId],
      });
    } catch (error) {
      console.error("❌ Failed to remove phone:", error);
    }
  };

  // SIMPLIFIED: Toggle Backpack guardian without immediate transaction
  const handleToggleBackpack = async () => {
    // First do a direct check with the blockchain to get the real status
    const realBackpackStatus = await isBackpackGuardian(user?.walletAddress as Address);

    // Only log critical mismatch information
    if (realBackpackStatus !== isBackpackRecoveryEnabled) {
      console.warn("⚠️ Backpack guardian status mismatch:", {
        uiState: isBackpackRecoveryEnabled,
        blockchainState: realBackpackStatus,
      });

      // If there's a mismatch between UI and blockchain state, correct it first
      setIsBackpackRecoveryEnabled(realBackpackStatus);

      // Wait a moment for state to update before continuing
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      const credentials = await selectCredential().catch((error) => {
        console.error("❌ Passkey selection canceled:", error);
        throw new Error("Passkey selection was canceled");
      });

      // Now toggle based on the correct state
      const newBackpackState = !isBackpackRecoveryEnabled;

      // Update the UI state immediately
      setIsBackpackRecoveryEnabled(newBackpackState);

      // Add to pending changes for blockchain transaction
      if (newBackpackState) {
        // If enabling Backpack, set the toggleBackpack flag to true
        addPendingChange({
          toggleBackpack: true,
        });
      } else {
        // If disabling Backpack, check if we need to add a revoke transaction
        const backpackGuardian = recoveryWallets.find(
          (wallet) => wallet.publicAddress?.toLowerCase() === BACKPACK_GUARDIAN_ADDRESS.toLowerCase()
        );

        if (backpackGuardian) {
          addPendingChange({
            toDelete: [backpackGuardian.id],
            toggleBackpack: false,
          });
        }
      }
    } catch (error) {
      console.error("❌ Failed to toggle Backpack guardian:", error);
    }
  };

  const handleSaveSettings = async () => {
    if (!user?.walletAddress || isSaving) return;
    setIsSaving(true);

    // Log critical operation start
    console.log("🔒 Starting security settings update");

    try {
      // Get credentials using the passkey selection context
      const credentials = await selectCredential().catch((error) => {
        console.error("❌ Passkey selection canceled:", error);
        throw new Error("Passkey selection was canceled");
      });

      // If we have no module installed yet and we're configuring guardians for the first time,
      // we can use the high-level setupSocialRecovery function
      if (!isModuleInstalled && pendingChanges.toAdd.length > 0) {
        setStatus(TransferStatus.PREPARING);

        // Create the recovery methods object
        const recoveryMethods = {
          email: pendingChanges.toAdd.find((method) => method.method === RecoveryWalletMethod.EMAIL)?.identifier || "",
          phone: pendingChanges.toAdd.find((method) => method.method === RecoveryWalletMethod.PHONE)?.identifier || "",
        };

        // Use the high-level setup function if we need to initialize the module
        await setupSocialRecovery({
          walletAddress: user.walletAddress as Address,
          credentials,
          recoveryMethods,
          callbacks: {
            onPreparing: () => {
              setStatus(TransferStatus.PREPARING);
            },
            onSigning: () => {
              setStatus(TransferStatus.SIGNING);
            },
            onSigningComplete: () => {
              setStatus(TransferStatus.SENDING);
            },
            onSent: () => {
              setStatus(TransferStatus.CONFIRMING);
            },
            onSuccess: async () => {
              console.log("✅ Recovery module successfully installed");
              setStatus(TransferStatus.SENT);
            },
            onError: (err: Error) => {
              console.error("❌ Failed to setup social recovery:", err);
              setStatus(TransferStatus.ERROR);
            },
          },
        });
      } else {
        // Handle individual changes if module is already installed

        // Create an array to hold all transactions
        const transactions: MetaTransaction[] = [];

        // 1. Handle Backpack guardian toggling using the dedicated utility
        if (pendingChanges.toggleBackpack) {
          setStatus(TransferStatus.PREPARING);
          console.log("🔄 Setting up Backpack as recovery guardian");

          // Use the dedicated utility for toggling Backpack recovery
          await toggleBackpackRecovery({
            accountAddress: user.walletAddress as Address,
            credentials,
            enable: true,
            threshold,
            callbacks: {
              onPreparing: () => {
                setStatus(TransferStatus.PREPARING);
              },
              onSigning: () => {
                setStatus(TransferStatus.SIGNING);
              },
              onSigningComplete: () => {
                setStatus(TransferStatus.SENDING);
              },
              onSent: () => {
                setStatus(TransferStatus.CONFIRMING);
              },
              onSuccess: () => {
                console.log("✅ Backpack guardian successfully enabled");
                setStatus(TransferStatus.SENT);
              },
              onError: (err: Error) => {
                console.error("❌ Failed to toggle Backpack recovery:", err);
                setStatus(TransferStatus.ERROR);
              },
            },
          });
        } else {
          // Process remaining operations

          // If the module is not installed, we need to enable it first
          if (!isModuleInstalled) {
            const enableModuleTx = createEnableModuleTransaction(user.walletAddress as Address);
            transactions.push(enableModuleTx);
          }

          // Handle pending additions one by one using addRecoveryMethod
          if (pendingChanges.toAdd.length > 0) {
            for (const method of pendingChanges.toAdd) {
              try {
                await addRecoveryMethod({
                  accountAddress: user.walletAddress as Address,
                  credentials,
                  identifier: method.identifier,
                  method: method.method,
                  threshold,
                  callbacks: {
                    onPreparing: () => {
                      setStatus(TransferStatus.PREPARING);
                    },
                    onSigning: () => {
                      setStatus(TransferStatus.SIGNING);
                    },
                    onSigningComplete: () => {
                      setStatus(TransferStatus.SENDING);
                    },
                    onSent: () => {
                      setStatus(TransferStatus.CONFIRMING);
                    },
                  },
                });
                console.log(`✅ Added ${method.method} guardian: ${method.identifier}`);
              } catch (error) {
                console.error(`❌ Failed to add ${method.method} guardian:`, error);
                // Continue processing other methods if one fails
              }
            }
          }

          // Handle removals - only if the module is already installed
          if (isModuleInstalled && pendingChanges.toDelete.length > 0) {
            // Find the wallet objects being deleted to get their addresses
            const walletsToDelete = recoveryWallets.filter((wallet) => pendingChanges.toDelete.includes(wallet.id));

            // Process deletions one by one
            for (const wallet of walletsToDelete) {
              // Skip if we can't find a public address
              if (!wallet.publicAddress) {
                console.warn(`⚠️ No public address found for guardian ${wallet.identifier}`);
                continue;
              }

              try {
                await removeRecoveryMethod({
                  accountAddress: user.walletAddress as Address,
                  credentials,
                  guardianAddress: wallet.publicAddress as Address,
                  threshold,
                  callbacks: {
                    onPreparing: () => {
                      setStatus(TransferStatus.PREPARING);
                    },
                    onSigning: () => {
                      setStatus(TransferStatus.SIGNING);
                    },
                    onSigningComplete: () => {
                      setStatus(TransferStatus.SENDING);
                    },
                    onSent: () => {
                      setStatus(TransferStatus.CONFIRMING);
                    },
                  },
                });
                console.log(`✅ Removed guardian: ${wallet.identifier}`);
              } catch (error) {
                console.error(`❌ Failed to remove guardian ${wallet.identifier}:`, error);
                // Continue processing other methods if one fails
              }
            }
          }

          // If threshold has changed and no other transactions are happening, update it
          if (isModuleInstalled && transactions.length === 0 && currentThreshold !== threshold) {
            const changeThresholdTx = await defaultSocialRecoveryModule.createChangeThresholdMetaTransaction(
              BigInt(threshold)
            );

            // Execute the change threshold transaction
            setStatus(TransferStatus.PREPARING);

            await executeDirectTransaction({
              safeAddress: user.walletAddress as Address,
              transactions: [changeThresholdTx],
              credentials,
              callbacks: {
                onPreparing: () => {
                  setStatus(TransferStatus.PREPARING);
                },
                onSigning: () => {
                  setStatus(TransferStatus.SIGNING);
                },
                onSigningComplete: () => {
                  setStatus(TransferStatus.SENDING);
                },
                onSent: () => {
                  setStatus(TransferStatus.CONFIRMING);
                },
                onSuccess: () => {
                  console.log(`✅ Threshold updated to ${threshold}`);
                  setStatus(TransferStatus.SENT);
                },
                onError: (err: Error) => {
                  console.error("❌ Failed to change threshold:", err);
                  setStatus(TransferStatus.ERROR);
                },
              },
            });
          }

          // Only proceed with batch if we accumulated any transactions
          if (transactions.length > 0) {
            setStatus(TransferStatus.PREPARING);

            // Execute any remaining transactions in a batch
            await executeDirectTransaction({
              safeAddress: user.walletAddress as Address,
              transactions,
              credentials,
              callbacks: {
                onPreparing: () => {
                  setStatus(TransferStatus.PREPARING);
                },
                onSigning: () => {
                  setStatus(TransferStatus.SIGNING);
                },
                onSigningComplete: () => {
                  setStatus(TransferStatus.SENDING);
                },
                onSent: () => {
                  setStatus(TransferStatus.CONFIRMING);
                },
                onSuccess: () => {
                  console.log("✅ All transactions processed successfully");
                  setStatus(TransferStatus.SENT);
                },
                onError: (err: Error) => {
                  console.error("❌ Failed to execute transactions:", err);
                  setStatus(TransferStatus.ERROR);
                },
              },
            });
          }
        }
      }

      // Clean up database records for removed guardians
      if (pendingChanges.toDelete.length > 0) {
        await Promise.all(
          pendingChanges.toDelete
            .filter((id) => !id.startsWith("blockchain-"))
            .map((id) => pylon.deleteRecoveryWallet(id))
        );
      }

      // Reset state and refresh
      clearPendingChanges();

      // Force a complete refresh of the recovery wallets state
      try {
        // Force a direct check of Backpack guardian status first
        const directBackpackStatus = await isBackpackGuardian(user.walletAddress as Address);

        // Refresh all recovery wallets
        await fetchRecoveryWallets();

        // Compare UI state with the direct check result and fix any mismatch
        if (directBackpackStatus !== isBackpackRecoveryEnabled) {
          console.warn("⚠️ Guardian status mismatch after save:", {
            ui: isBackpackRecoveryEnabled,
            blockchain: directBackpackStatus,
          });

          // Force the correct state
          setIsBackpackRecoveryEnabled(directBackpackStatus);
        }
      } catch (refreshError) {
        console.error("❌ Error refreshing recovery wallets:", refreshError);
      }

      setStatus(TransferStatus.IDLE);
      console.log("✅ Security settings successfully updated");
    } catch (error) {
      console.error("❌ Failed to save security settings:", error);
      setStatus(TransferStatus.ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  // Render status message with more details and spinner during signing
  const renderStatusMessage = () => {
    if (status === TransferStatus.IDLE) return null;

    const statusMessages = {
      [TransferStatus.PREPARING]: "Preparing blockchain transaction...",
      [TransferStatus.SIGNING]: "Please approve the transaction with your passkey...",
      [TransferStatus.SENDING]: "Transaction signed! Sending to the blockchain...",
      [TransferStatus.CONFIRMING]: "Transaction sent! Waiting for confirmation on the blockchain...",
      [TransferStatus.SENT]: "Security settings updated successfully!",
      [TransferStatus.ERROR]: "Error processing transaction. Please try again.",
    };

    return (
      <div className="p-4 mt-4 bg-default-100 rounded-lg">
        <div className="flex items-center mb-1">
          {status === TransferStatus.ERROR ? (
            <AlertTriangle className="text-danger mr-2" size={18} />
          ) : status === TransferStatus.SIGNING ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-teal-600 mr-2" />
          ) : (
            <Clock className="text-primary mr-2" size={18} />
          )}
          <p className="text-sm font-medium">{statusMessages[status]}</p>
        </div>
        {status === TransferStatus.SIGNING && (
          <p className="text-xs text-foreground-500 mt-1 ml-6">
            A passkey prompt should appear. Please complete the authentication to continue.
          </p>
        )}
        {status === TransferStatus.SENT && (
          <div className="flex flex-col gap-2 mt-4">
            <p className="text-sm text-gray-500">
              Changes are saved to the blockchain and are permanent and secure. Your changes are now
              &quot;on-chain&quot; which means they cannot be altered.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Map recovery options to their rendering components
  const renderRecoveryOption = (method: RecoveryMethod) => {
    switch (method) {
      case "EMAIL":
        return (
          <EmailRecovery
            configuredEmails={configuredEmails}
            emailInput={emailInput}
            handleAddEmail={handleAddEmail}
            handleRemoveEmail={handleRemoveEmail}
            setEmailInput={setEmailInput}
          />
        );
      case "PHONE":
        return (
          <PhoneRecovery
            configuredPhone={configuredPhone}
            handleAddPhone={handleAddPhone}
            handleRemovePhone={handleRemovePhone}
            phoneInput={phoneInput}
            setPhoneInput={setPhoneInput}
          />
        );
      case "BACKPACK":
        return (
          <BackpackRecovery
            handleToggleBackpack={handleToggleBackpack}
            isBackpackRecoveryEnabled={isBackpackRecoveryEnabled}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      hideCloseButton
      classNames={{
        backdrop: "bg-black/80",
        body: "p-0",
        base: "max-h-[calc(100vh-64px)]",
        wrapper: "overflow-hidden",
      }}
      isOpen={isOpen}
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        {/* Fixed Header */}
        <ModalHeader className="border-b border-divider py-4 px-6">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-medium">Security Settings</h2>
            <Button isIconOnly aria-label="Close" className="min-w-0 w-8 h-8" variant="light" onPress={onClose}>
              <XIcon size={20} />
            </Button>
          </div>
        </ModalHeader>

        {/* Scrollable Content */}
        <ModalBody className="p-0 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Status messages */}
            {status === TransferStatus.ERROR && (
              <div className="bg-default-100 p-4 rounded-lg mb-4">
                <p className="text-sm">Error processing transaction. Please try again.</p>
              </div>
            )}

            {status !== TransferStatus.IDLE && status !== TransferStatus.ERROR && renderStatusMessage()}

            {/* Recovery Module Status */}
            {!isModuleInstalled && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex gap-3">
                  <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Recovery Module Not Installed
                    </h4>
                    <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                      Configure your recovery options below and click &quot;Save Security Settings&quot; to install the
                      recovery module and set up your guardians. This will require a one-time passkey signature.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recovery warning based on configuration */}
            <RecoveryWarning configuredCount={pendingConfiguredCount} threshold={threshold} />

            {/* Recovery Header with Threshold Selection */}
            <RecoveryHeader
              configuredCount={pendingConfiguredCount}
              threshold={threshold}
              onThresholdChange={setThreshold}
            />

            {/* Recovery Options Accordion */}
            <div className="space-y-2">
              {RECOVERY_OPTIONS.map((option) => (
                <RecoverySection
                  key={option.id}
                  description={option.description}
                  icon={option.icon}
                  id={option.id}
                  isComingSoon={option.isComingSoon}
                  isExpanded={expandedSection === option.id}
                  title={option.title}
                  toggleExpanded={toggleSection}
                >
                  {renderRecoveryOption(option.method)}
                </RecoverySection>
              ))}
            </div>

            <div className="space-y-8">
              {/* Time settings section */}
              <TimeSettingCard
                description="Set how long the recovery process will take. This gives you time to cancel if someone tries to recover your account without permission."
                icon={Clock}
                isComingSoon={true}
                options={GRACE_PERIOD_OPTIONS}
                selectedValue={recoveryDelay}
                title="Recovery Grace Period"
                onValueChange={setRecoveryDelay}
              />

              <TimeSettingCard
                description="Automatically transfer assets to a backup wallet after a period of inactivity."
                icon={ShieldAlert}
                isComingSoon={true}
                options={DEAD_SWITCH_OPTIONS}
                selectedValue={transactionDelay}
                title="Dead Switch (Inactivity Protection)"
                onValueChange={setTransactionDelay}
              />
            </div>
          </div>
        </ModalBody>

        {/* Fixed Footer with Action Buttons - Improved dark mode contrast */}
        <ModalFooter className="sticky bottom-0 border-t border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 z-10 px-6 py-4">
          <div className="flex w-full justify-end gap-2">
            {hasPendingChanges && (
              <Button
                className="font-medium"
                radius="sm"
                size="md"
                variant="bordered"
                onPress={() => clearPendingChanges()}
              >
                Undo Changes
              </Button>
            )}
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium"
              color="primary"
              isDisabled={isSaving || !hasPendingChanges || !isSettingsValid}
              isLoading={isSaving}
              radius="sm"
              size="md"
              onPress={handleSaveSettings}
            >
              Save Security Settings
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

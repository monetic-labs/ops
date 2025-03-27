import type { Account } from "@/types/account";

import { Button } from "@heroui/button";
import { ArrowRight, Info, X } from "lucide-react";
import { Tooltip } from "@heroui/tooltip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Address } from "viem";

import { MoneyInput } from "@/components/generics/money-input";
import { BalanceDisplay } from "@/components/generics/balance-display";
import { executeNestedTransaction } from "@/utils/safe/flows/nested";
import { executeNestedTransferFromRainCardAcccount } from "@/utils/safe/features/rain";
import { createERC20TransferTemplate } from "@/utils/safe/templates";
import { getEstimatedTransferFee } from "@/utils/safe/features/fee-estimation";
import { useUser } from "@/contexts/UserContext";
import { TransferStatus, TransferStatusOverlay } from "@/components/generics/transfer-status";
import { formatAmountUSD, roundToCurrency } from "@/utils/helpers";
import { BASE_USDC } from "@/utils/constants";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccount: Account;
  setSelectedAccount: (account: Account) => void;
  toAccount: Account | null;
  setToAccount: (account: Account | null) => void;
  amount: string;
  setAmount: (amount: string) => void;
  onSelectToAccount: () => void;
  isAmountValid: () => boolean;
  onTransfer: () => void;
  availableAccounts: Account[];
  onCancel: () => void;
}

export function SendModal({
  isOpen,
  onClose,
  selectedAccount,
  setSelectedAccount,
  toAccount,
  setToAccount,
  amount,
  setAmount,
  onSelectToAccount,
  isAmountValid,
  onTransfer,
  availableAccounts,
  onCancel,
}: SendModalProps) {
  const [isAccountSelectionOpen, setIsAccountSelectionOpen] = useState(false);
  const [transferStatus, setTransferStatus] = useState<TransferStatus>(TransferStatus.IDLE);
  const [estimatedFee, setEstimatedFee] = useState("0.00");
  const { credentials, user } = useUser();
  const { selectCredential } = usePasskeySelection();
  const [isLoading, setIsLoading] = useState(false);

  // Utility function for precise balance calculation and formatting
  const getFormattedBalance = (accountBalance: number, transferAmount: number, isSource: boolean): string => {
    const amountNum = parseFloat(transferAmount.toString()) || 0;
    if (isSource) {
      // For source account, subtract the amount
      return roundToCurrency(accountBalance - amountNum).toLocaleString();
    } else {
      // For destination account, add the amount
      return roundToCurrency(accountBalance + amountNum).toLocaleString();
    }
  };

  // Reset internal state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTransferStatus(TransferStatus.IDLE);
      setIsLoading(false);
      setIsAccountSelectionOpen(false);
      setEstimatedFee("0.00");
    }
  }, [isOpen]);

  const handleSetMaxAmount = () => {
    if (selectedAccount?.balance) {
      setAmount(selectedAccount.balance.toString());
    }
  };

  // Update estimated fee when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const updateFee = async () => {
        try {
          const { feeInUsd } = await getEstimatedTransferFee();

          setEstimatedFee(feeInUsd);
        } catch (error) {
          console.error("Error getting estimated fee:", error);
          setEstimatedFee("0.00"); // Fallback value
        }
      };

      updateFee();
    } else {
      setEstimatedFee("0.00");
    }
  }, [amount]);

  useEffect(() => {
    const eligibleAccounts = availableAccounts.filter(
      (acc) => acc.address !== selectedAccount.address && !acc.isDisabled
    );

    if (eligibleAccounts.length === 1 && !toAccount) {
      onSelectToAccount();
    }
  }, [availableAccounts, selectedAccount, toAccount, onSelectToAccount]);

  const handleAccountSelection = (account: Account) => {
    onSelectToAccount();
    setIsAccountSelectionOpen(false);
  };

  const handleSend = async () => {
    if (!selectedAccount || !toAccount || !amount || !credentials || !user?.walletAddress) return;

    try {
      console.log("=== Transfer Debug: Starting transfer process ===");
      console.log("fromAccount:", selectedAccount);
      console.log("toAccount:", toAccount);
      console.log("amount:", amount);
      console.log("userWallet:", user.walletAddress);

      setIsLoading(true);

      // Select a credential to use - this will automatically handle showing the modal if needed
      let selectedCredential;
      try {
        selectedCredential = await selectCredential();
      } catch (error) {
        console.error("Credential selection failed:", error);
        toast.error("Failed to select a passkey. Please try again.");
        setIsLoading(false);
        return;
      }

      // Edge case: Rain Card to Sub-account (withdrawal)
      if (selectedAccount.isCard && !toAccount.isCard) {
        console.log("Transfer type: Rain Card withdrawal");
        setTransferStatus(TransferStatus.PREPARING);

        // Use the Rain Card withdrawal flow
        await executeNestedTransferFromRainCardAcccount({
          fromSafeAddress: user.walletAddress as Address,
          throughSafeAddress: toAccount.address as Address,
          toAddress: toAccount.address as Address,
          tokenAddress: BASE_USDC.ADDRESS,
          tokenDecimals: BASE_USDC.DECIMALS,
          amount,
          credentials: selectedCredential,
          rainControllerAddress: selectedAccount.rainControllerAddress as Address,
          rainCollateralProxyAddress: selectedAccount.address as Address,
          callbacks: {
            onPreparing: () => {
              console.log("Rain withdrawal state: PREPARING");
              setTransferStatus(TransferStatus.PREPARING);
            },
            onSigning: () => {
              console.log("Rain withdrawal state: SIGNING");
              setTransferStatus(TransferStatus.SIGNING);
            },
            onSigningComplete: () => {
              console.log("Rain withdrawal state: SIGNING COMPLETE");
              setTransferStatus(TransferStatus.SENDING);
            },
            onSent: () => {
              console.log("Rain withdrawal state: SENT/CONFIRMING");
              setTransferStatus(TransferStatus.CONFIRMING);
            },
            onSuccess: () => {
              console.log("Rain withdrawal state: SUCCESS");
              setTransferStatus(TransferStatus.SENT);
              toast.success("Rain Card withdrawal completed successfully");
              onTransfer(); // Update account balances
            },
            onError: (error: Error) => {
              console.error("Rain Card withdrawal error:", error);
              console.error("Error details:", {
                message: error.message,
                name: error.name,
                stack: error.stack,
              });
              setTransferStatus(TransferStatus.ERROR);
              toast.error("Rain Card withdrawal failed. Please try again.");
            },
          },
        });

        setIsLoading(false);

        return;
      }

      console.log("Transfer type: Regular ERC20 transfer");

      // Creating ERC20 template
      console.log("Creating ERC20 transfer template...");
      const transferTemplate = createERC20TransferTemplate({
        tokenAddress: BASE_USDC.ADDRESS,
        toAddress: toAccount.address as Address,
        amount,
        decimals: BASE_USDC.DECIMALS,
      });

      console.log("Transfer template created:", transferTemplate);

      // Regular ERC20 transfer
      console.log("Executing nested transaction...");
      await executeNestedTransaction({
        fromSafeAddress: user.walletAddress as Address,
        throughSafeAddress: selectedAccount.address,
        transactions: [transferTemplate],
        credentials: selectedCredential,
        callbacks: {
          onPreparing: () => {
            console.log("Transaction state: PREPARING");
            setTransferStatus(TransferStatus.PREPARING);
          },
          onSigning: () => {
            console.log("Transaction state: SIGNING");
            setTransferStatus(TransferStatus.SIGNING);
          },
          onSigningComplete: () => {
            console.log("Transaction state: SIGNING COMPLETE");
            setTransferStatus(TransferStatus.SENDING);
          },
          onSent: () => {
            console.log("Transaction state: SENT/CONFIRMING");
            setTransferStatus(TransferStatus.CONFIRMING);
          },
          onSuccess: () => {
            console.log("Transaction state: SUCCESS");
            setTransferStatus(TransferStatus.SENT);
            toast.success("Transfer completed successfully");
            onTransfer(); // Update account balances
          },
          onError: (error: Error) => {
            console.error("Transfer error:", error);
            console.error("Error details:", {
              message: error.message,
              name: error.name,
              stack: error.stack,
            });
            setTransferStatus(TransferStatus.ERROR);
            toast.error("Transfer failed. Please try again.");
          },
        },
      });
    } catch (error) {
      console.error("Error in transfer process:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      setTransferStatus(TransferStatus.ERROR);
      toast.error(`Transfer failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get required signatures from the account
  const requiredSignatures = selectedAccount.threshold || 1;
  const totalSigners = selectedAccount.signers.length || 1;
  const signatureDisplay = `${requiredSignatures} of ${totalSigners}`;

  // Determine if we're in an active transfer state
  const isActiveTransfer = transferStatus !== TransferStatus.IDLE;

  // Create transfer details component for the overlay
  const transferDetailsComponent = toAccount && (
    <>
      <div className="bg-content2/50 border border-border rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {selectedAccount.icon && <selectedAccount.icon className="w-5 h-5 text-foreground/60" />}
            <span className="font-medium">{selectedAccount.name}</span>
          </div>
          <ArrowRight className="w-5 h-5 text-foreground/40" />
          <div className="flex items-center gap-3">
            {toAccount.icon && React.createElement(toAccount.icon, { className: "w-5 h-5 text-foreground/60" })}
            <span className="font-medium">{toAccount.name}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground/60">Amount</span>
          <span className="font-medium">{formatAmountUSD(parseFloat(amount))}</span>
        </div>
      </div>
    </>
  );

  const handleResetTransferStatus = () => {
    setTransferStatus(TransferStatus.IDLE);
    setIsLoading(false);
  };

  return (
    <>
      <Modal
        classNames={{
          backdrop: "bg-background/70 backdrop-blur-sm",
          base: "border-border",
        }}
        isOpen={isOpen}
        size="lg"
        onClose={isActiveTransfer && transferStatus !== TransferStatus.ERROR ? () => {} : onClose}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex justify-between items-center px-6 py-4 border-b border-border bg-content1/80 backdrop-blur-md">
                <h3 className="text-xl font-semibold">
                  {isActiveTransfer ? "Processing Transfer" : "Internal Transfer"}
                </h3>
                <Button
                  isIconOnly
                  aria-label="Close"
                  isDisabled={isActiveTransfer && transferStatus !== TransferStatus.ERROR}
                  variant="light"
                  onPress={onClose}
                >
                  <X size={20} />
                </Button>
              </ModalHeader>

              {isActiveTransfer ? (
                <div className="p-6">
                  <TransferStatusOverlay
                    status={transferStatus}
                    transferDetails={transferDetailsComponent}
                    onComplete={() => {
                      onClose();
                    }}
                    onReset={handleResetTransferStatus}
                  />
                </div>
              ) : (
                <>
                  <ModalBody className="p-4 md:p-6 overflow-y-auto">
                    <div className="flex flex-col gap-6 w-full mx-auto">
                      {/* Transfer Route Display */}
                      <div className="flex items-center justify-between gap-4 bg-content2 p-4 rounded-xl">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            {selectedAccount.icon && <selectedAccount.icon className="w-5 h-5 text-foreground/60" />}
                            <span className="font-medium">{selectedAccount.name}</span>
                          </div>
                          {amount && (
                            <span
                              className={`text-sm ${parseFloat(amount) > (selectedAccount?.balance || 0) ? "text-danger" : "text-foreground/60"}`}
                            >
                              New balance: $
                              {getFormattedBalance(selectedAccount.balance || 0, parseFloat(amount), true)}
                            </span>
                          )}
                        </div>
                        <Button
                          isIconOnly
                          className="min-w-0 p-2 hover:bg-content3"
                          variant="light"
                          onPress={() => {
                            if (toAccount) {
                              const temp = selectedAccount;

                              setSelectedAccount(toAccount);
                              setToAccount(temp);
                            }
                          }}
                        >
                          <ArrowRight className="w-5 h-5 text-foreground/40" />
                        </Button>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 justify-end">
                            <Button
                              className="font-medium bg-content3 hover:bg-content4 h-9"
                              onClick={() => setIsAccountSelectionOpen(true)}
                            >
                              {toAccount ? (
                                <div className="flex items-center gap-2">
                                  {toAccount.icon &&
                                    React.createElement(toAccount.icon, { className: "w-5 h-5 text-foreground/60" })}
                                  {toAccount.name}
                                </div>
                              ) : (
                                "Select Account"
                              )}
                            </Button>
                          </div>
                          {amount && toAccount && (
                            <span className="text-sm text-foreground/60 text-right">
                              New balance: ${getFormattedBalance(toAccount.balance || 0, parseFloat(amount), false)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="bg-content2 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-foreground/60">Amount</span>
                          {selectedAccount && (
                            <BalanceDisplay balance={selectedAccount.balance || 0} onClick={handleSetMaxAmount} />
                          )}
                        </div>
                        <MoneyInput
                          isError={Boolean(
                            amount && selectedAccount && parseFloat(amount) > (selectedAccount.balance || 0)
                          )}
                          value={amount}
                          onChange={setAmount}
                        />
                      </div>

                      {/* Transfer Information */}
                      <div className="bg-content2 rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-foreground/60 mb-1">
                              <span>Estimated Time</span>
                              <Tooltip content="Internal transfers usually complete within 1 minute">
                                <Info className="text-foreground/40 cursor-help" size={14} />
                              </Tooltip>
                            </div>
                            <span className="font-medium">Instant</span>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-foreground/60 mb-1">
                              <span>Transfer Fee</span>
                              <Tooltip content="We cover all swap fees for you.">
                                <Info className="text-foreground/40 cursor-help" size={14} />
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-1 ">
                              <span className="font-medium text-primary">Free</span>
                              <span className="font-medium line-through text-foreground/60">
                                {parseFloat(estimatedFee) > 0.01 ? formatAmountUSD(parseFloat(estimatedFee)) : "$0.01"}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 items-end">
                            <span className="text-sm text-foreground/60 block mb-1">Required Signatures</span>
                            <span className="font-medium">{signatureDisplay}</span>
                          </div>
                        </div>
                      </div>

                      {amount && parseFloat(amount) > 10000 && (
                        <div className="bg-warning/10 rounded-xl p-4">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-warning mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">Transfer Requirements</p>
                              <p className="text-sm text-foreground/60 mt-1">
                                This transfer will require approval from {requiredSignatures} signer
                                {requiredSignatures > 1 ? "s" : ""} since it exceeds $10,000
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ModalBody>

                  <ModalFooter className="flex justify-between mt-4">
                    <Button className="bg-transparent border border-border hover:bg-content2" onClick={onCancel}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      isDisabled={!isAmountValid() || isLoading}
                      isLoading={isLoading}
                      onClick={handleSend}
                    >
                      {isLoading ? "Processing..." : "Send"}
                    </Button>
                  </ModalFooter>
                </>
              )}
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isAccountSelectionOpen} onOpenChange={(open) => setIsAccountSelectionOpen(open)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Select Destination Account</ModalHeader>
              <ModalBody className="gap-3 p-6">
                {availableAccounts
                  .filter((acc) => acc.address !== selectedAccount.address && !acc.isDisabled)
                  .map((account) => (
                    <Button
                      key={account.address}
                      className="w-full justify-start h-auto p-4 bg-content2 hover:bg-content3"
                      onPress={() => handleAccountSelection(account)}
                    >
                      <div className="flex items-center gap-3">
                        {account.icon && React.createElement(account.icon, { className: "w-5 h-5 text-foreground/60" })}
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{account.name}</span>
                          <span className="text-sm text-foreground/60">${account.balance?.toLocaleString()}</span>
                        </div>
                      </div>
                    </Button>
                  ))}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

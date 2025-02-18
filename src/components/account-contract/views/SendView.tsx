import type { Account } from "@/types/account";

import { Button } from "@nextui-org/button";
import { Card, CardBody } from "@nextui-org/card";
import { ArrowRight, Info, X } from "lucide-react";
import { Tooltip } from "@nextui-org/tooltip";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";
import React, { useEffect, useState } from "react";

import { MoneyInput } from "@/components/generics/money-input";
import { BalanceDisplay } from "@/components/generics/balance-display";

interface SendViewProps {
  selectedAccount: Account;
  setSelectedAccount: (account: Account) => void;
  onClose: () => void;
  toAccount: Account | null;
  setToAccount: (account: Account | null) => void;
  amount: string;
  setAmount: (amount: string) => void;
  onSelectToAccount: () => void;
  isAmountValid: () => boolean;
  onTransfer: () => void;
  availableAccounts: Account[];
}

export function SendView({
  selectedAccount,
  setSelectedAccount,
  onClose,
  toAccount,
  setToAccount,
  amount,
  setAmount,
  onSelectToAccount,
  isAmountValid,
  onTransfer,
  availableAccounts,
}: SendViewProps) {
  const [isAccountSelectionOpen, setIsAccountSelectionOpen] = useState(false);

  const handleSetMaxAmount = () => {
    if (selectedAccount?.balance) {
      setAmount(selectedAccount.balance.toString());
    }
  };

  useEffect(() => {
    const eligibleAccounts = availableAccounts.filter(
      (acc) => acc.address !== selectedAccount.address && !acc.isDisabled
    );

    if (eligibleAccounts.length === 1 && !toAccount) {
      const selectedDestination = eligibleAccounts[0];

      onSelectToAccount();
    }
  }, [availableAccounts, selectedAccount, toAccount]);

  const handleAccountSelection = (account: Account) => {
    const selectedDestination = account;

    onSelectToAccount();
    setIsAccountSelectionOpen(false);
  };

  return (
    <Card className="w-full bg-content1/90 border border-border backdrop-blur-sm">
      <CardBody className="p-0">
        <div>
          <div className="sticky top-0 z-20 flex justify-between items-center px-8 py-5 border-b border-border bg-content1/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-content2/60">
                <selectedAccount.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{selectedAccount.name}</h2>
                <p className="text-sm text-foreground/60">Send funds</p>
              </div>
            </div>
            <Button
              isIconOnly
              className="w-10 h-10 text-foreground/60 hover:text-foreground bg-content2/60 hover:bg-content2"
              variant="light"
              onPress={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-4 md:p-6">
            <div className="flex flex-col gap-6 max-w-xl mx-auto">
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
                      New balance: ${((selectedAccount?.balance || 0) - parseFloat(amount || "0")).toLocaleString()}
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
                      New balance: ${((toAccount.balance || 0) + parseFloat(amount || "0")).toLocaleString()}
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
                  isError={Boolean(amount && selectedAccount && parseFloat(amount) > (selectedAccount.balance || 0))}
                  value={amount}
                  onChange={setAmount}
                />
              </div>

              {/* Transfer Information */}
              <div className="bg-content2 rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-foreground/60 mb-1">
                      <span>Estimated Time</span>
                      <Tooltip content="Internal transfers usually complete within 1 minute">
                        <Info className="text-foreground/40 cursor-help" size={14} />
                      </Tooltip>
                    </div>
                    <span className="font-medium">Instant</span>
                  </div>

                  <div>
                    <span className="text-sm text-foreground/60 block mb-1">Transfer Fee</span>
                    <span className="font-medium">$0.00</span>
                  </div>

                  <div>
                    <span className="text-sm text-foreground/60 block mb-1">Required Signatures</span>
                    <span className="font-medium">2 of 3</span>
                  </div>

                  <div>
                    <span className="text-sm text-foreground/60 block mb-1">Daily Limit</span>
                    <span className="font-medium">$50,000</span>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <Button
                className="w-full h-11 text-base font-medium bg-primary hover:opacity-90 text-primary-foreground transition-opacity duration-200 disabled:opacity-50"
                isDisabled={!selectedAccount || !toAccount || !amount || !isAmountValid()}
                onClick={onTransfer}
              >
                {!selectedAccount || !toAccount
                  ? "Select Destination Account"
                  : !amount
                    ? "Enter Amount"
                    : !isAmountValid()
                      ? "Insufficient Balance"
                      : "Confirm Transfer"}
              </Button>

              {amount && parseFloat(amount) > 10000 && (
                <div className="bg-warning/10 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Transfer Requirements</p>
                      <p className="text-sm text-foreground/60 mt-1">
                        This transfer will require approval from 2 operators since it exceeds $10,000
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardBody>

      <Modal isOpen={isAccountSelectionOpen} size="lg" onClose={() => setIsAccountSelectionOpen(false)}>
        <ModalContent>
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
        </ModalContent>
      </Modal>
    </Card>
  );
}

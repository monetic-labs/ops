import { Button } from "@nextui-org/button";
import { Card, CardBody } from "@nextui-org/card";
import { ArrowRight, Info, X } from "lucide-react";
import { Tooltip } from "@nextui-org/tooltip";
import React from "react";

import { Account } from "@/contexts/AccountContext";
import { MoneyInput } from "@/components/generics/money-input";
import { BalanceDisplay } from "@/components/generics/balance-display";

interface SendViewProps {
  selectedAccount: Account;
  onClose: () => void;
  toAccount: Account | null;
  amount: string;
  setAmount: (amount: string) => void;
  onSelectToAccount: () => void;
  isAmountValid: () => boolean;
  onTransfer: () => void;
}

export function SendView({
  selectedAccount,
  onClose,
  toAccount,
  amount,
  setAmount,
  onSelectToAccount,
  isAmountValid,
  onTransfer,
}: SendViewProps) {
  const handleSetMaxAmount = () => {
    if (selectedAccount?.balance) {
      setAmount(selectedAccount.balance.toString());
    }
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
              variant="light"
              onPress={onClose}
              className="w-10 h-10 text-foreground/60 hover:text-foreground bg-content2/60 hover:bg-content2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-4 md:p-6">
            <div className="flex flex-col gap-6 max-w-xl mx-auto">
              {/* Transfer Route Display */}
              <div className="flex items-center justify-between gap-4 bg-content2 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  {selectedAccount.icon && <selectedAccount.icon className="w-5 h-5 text-foreground/60" />}
                  <span className="font-medium">{selectedAccount.name}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-foreground/40" />
                <div className="flex items-center gap-3">
                  <Button className="font-medium bg-content3 hover:bg-content4 h-9" onClick={onSelectToAccount}>
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
                {amount && (
                  <div className="mt-3 flex flex-col gap-1 text-sm">
                    <div className="flex justify-between items-center text-foreground/60">
                      <span>{selectedAccount.name}</span>
                      <span className={parseFloat(amount) > (selectedAccount?.balance || 0) ? "text-danger" : ""}>
                        New balance: ${((selectedAccount?.balance || 0) - parseFloat(amount || "0")).toLocaleString()}
                      </span>
                    </div>
                    {toAccount && (
                      <div className="flex justify-between items-center text-foreground/60">
                        <span>{toAccount.name}</span>
                        <span>
                          New balance: ${((toAccount.balance || 0) + parseFloat(amount || "0")).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
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
    </Card>
  );
}

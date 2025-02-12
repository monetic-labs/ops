"use client";

import type { Account } from "@/types/account";
import type { TransferActivity } from "./types";

import { useState } from "react";
import { Card, CardBody } from "@nextui-org/card";

import { useAccounts } from "@/hooks/useAccounts";

import { AccountHeader } from "./components/AccountHeader";
import { AccountBalance } from "./components/AccountBalance";
import { AccountNavigation } from "./components/AccountNavigation";
import { ActivityView } from "./views/ActivityView";
import { OperatorsView } from "./views/OperatorsView";
import { PoliciesView } from "./views/PoliciesView";
import { SendView } from "./views/SendView";
import { ReceiveView } from "./views/ReceiveView";

export default function AccountMeta() {
  const { accounts, getEnabledAccounts } = useAccounts();
  const [selectedAccount, setSelectedAccount] = useState<Account>(accounts[0]);
  const [activeTab, setActiveTab] = useState<string>("activity");
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [activities] = useState<TransferActivity[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const totalBalance = accounts.reduce((sum: number, account: Account) => sum + (account.balance || 0), 0);
  const enabledAccounts = getEnabledAccounts();

  const handleSend = () => {
    setIsSendModalOpen(true);
  };

  const handleReceive = () => {
    setIsReceiveModalOpen(true);
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setIsExpanded(true); // Expand when selecting a new account
  };

  const isAmountValid = () => {
    if (!amount || !selectedAccount) return false;
    const numericAmount = parseFloat(amount);

    return numericAmount > 0 && numericAmount <= (selectedAccount.balance || 0);
  };

  const handleTransfer = () => {
    if (!selectedAccount || !toAccount || !isAmountValid()) return;
    // Implement transfer logic here
    setIsSendModalOpen(false);
  };

  if (isSendModalOpen) {
    return (
      <SendView
        amount={amount}
        availableAccounts={enabledAccounts}
        isAmountValid={isAmountValid}
        selectedAccount={selectedAccount}
        setAmount={setAmount}
        setSelectedAccount={setSelectedAccount}
        setToAccount={setToAccount}
        toAccount={toAccount}
        onClose={() => setIsSendModalOpen(false)}
        onSelectToAccount={() => setToAccount(accounts[1])}
        onTransfer={handleTransfer}
      />
    );
  }

  if (isReceiveModalOpen) {
    return (
      <ReceiveView
        availableAccounts={enabledAccounts}
        selectedAccount={selectedAccount}
        selectedSettlementAccount={accounts[0]}
        onChangeSettlementAccount={setSelectedAccount}
        onClose={() => setIsReceiveModalOpen(false)}
      />
    );
  }

  return (
    <Card className="w-full bg-content1/90 border border-border backdrop-blur-sm">
      <CardBody className="p-0">
        <div className="flex flex-col">
          <AccountHeader
            accounts={accounts}
            isExpanded={isExpanded}
            selectedAccount={selectedAccount}
            totalBalance={totalBalance.toString()}
            onAccountSelect={handleAccountSelect}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />

          <div
            className={`
              transform transition-all duration-300 ease-in-out
              ${isExpanded ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0"}
              overflow-hidden
            `}
          >
            <div className="p-6 space-y-6 border-t border-border">
              <AccountBalance account={selectedAccount} onReceive={handleReceive} onSend={handleSend} />

              <AccountNavigation selectedTab={activeTab} onTabChange={setActiveTab} />

              <div>
                {activeTab === "activity" && <ActivityView activities={activities} />}
                {activeTab === "operators" && <OperatorsView />}
                {activeTab === "policies" && <PoliciesView />}
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

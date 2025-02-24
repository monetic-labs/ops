"use client";

import type { Account, Signer } from "@/types/account";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/card";

import { useAccountManagement } from "@/hooks/useAccountManagement";

import { AccountHeader } from "./components/AccountHeader";
import { AccountBalance } from "./components/AccountBalance";
import { AccountNavigation } from "./components/AccountNavigation";
import { DeployAccountModal } from "./components/DeployAccountModal";
import { ActivityView } from "./views/ActivityView";
import { SignersView } from "./views/SignersView";
import { PoliciesView } from "./views/PoliciesView";
import { SendView } from "./views/SendView";
import { ReceiveView } from "./views/ReceiveView";
import { AccountSelectionModal } from "./components/AccountSelectionModal";

export default function AccountMeta() {
  const { accounts, getEnabledAccounts, registerSubAccount, isLoadingAccounts } = useAccountManagement();
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>("activity");
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedSigners, setSelectedSigners] = useState<Signer[]>([]);
  const [threshold, setThreshold] = useState(1);
  const [isAccountSelectionOpen, setIsAccountSelectionOpen] = useState(false);

  useEffect(() => {
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts]);

  if (isLoadingAccounts) {
    return (
      <Card className="w-full bg-content1/90 border border-border backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-content1/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-2xl font-semibold mb-2">Loading accounts...</h3>
        </div>
      </Card>
    );
  }

  if (!selectedAccount) {
    return null;
  }

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
    setIsExpanded(true);
    setIsAccountSelectionOpen(false);
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

  const handleDeploy = () => {
    if (!selectedAccount) return;
    registerSubAccount(selectedAccount.address, selectedAccount.name);
    setSelectedAccount((prevSelectedAccount) => {
      if (!prevSelectedAccount) return prevSelectedAccount;
      return {
        ...prevSelectedAccount,
        isEnabled: true,
        signers: selectedSigners,
        threshold,
      };
    });
    setIsDeployModalOpen(false);
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
    <Card className="w-full bg-content1/90 border border-border backdrop-blur-sm relative">
      {selectedAccount && !selectedAccount.isDeployed && (
        <div className="absolute inset-0 bg-content1/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-2xl font-semibold mb-2">Activate your account</h3>
          <p className="text-foreground/60 mb-4">This account needs to be activated before it can be used.</p>
          <button
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/80 transition-colors"
            onClick={() => setIsDeployModalOpen(true)}
          >
            Deploy Account
          </button>
        </div>
      )}

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
                {activeTab === "activity" && <ActivityView activities={selectedAccount.recentActivity} />}
                {activeTab === "signers" && <SignersView signers={selectedAccount.signers} />}
                {activeTab === "policies" && <PoliciesView />}
              </div>
            </div>
          </div>
        </div>
      </CardBody>

      <DeployAccountModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        onDeploy={handleDeploy}
        accounts={accounts}
        selectedAccount={selectedAccount}
        selectedSigners={selectedSigners}
        setSelectedSigners={setSelectedSigners}
        threshold={threshold}
        setThreshold={setThreshold}
      />

      <AccountSelectionModal
        isOpen={isAccountSelectionOpen}
        onClose={() => setIsAccountSelectionOpen(false)}
        accounts={accounts.filter((acc) => !acc.isDisabled && !acc.isComingSoon)}
        onSelect={handleAccountSelect}
        selectedAccountId={selectedAccount.id}
        title="Select Account"
      />
    </Card>
  );
}

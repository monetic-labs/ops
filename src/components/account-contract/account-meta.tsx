"use client";

import type { Account, Signer } from "@/types/account";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Modal, ModalContent } from "@nextui-org/modal";
import { SkeletonAccountCard } from "./components/SkeletonLoaders";

import { useAccountManagement } from "@/hooks/useAccountManagement";

import { AccountHeader } from "./components/AccountHeader";
import { AccountBalance } from "./components/AccountBalance";
import { AccountNavigation } from "./components/AccountNavigation";
import { DeployAccountModal } from "./modals/DeployAccountModal";
import { ActivityView } from "./views/ActivityView";
import { SignersView } from "./views/SignersView";
import { PoliciesView } from "./views/PoliciesView";
import { SendModal } from "./modals/SendModal";
import { ReceiveModal } from "./modals/ReceiveModal";
import { AccountSelectionModal } from "./modals/AccountSelectionModal";

export default function AccountMeta() {
  const {
    accounts,
    getEnabledAccounts,
    registerSubAccount,
    isLoadingAccounts,
    refreshAccounts,
    updateAccountBalancesAfterTransfer,
  } = useAccountManagement();
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

  // If we're loading accounts but don't have any yet, show the full skeleton
  if (isLoadingAccounts && accounts.length === 0) {
    return (
      <Card className="w-full bg-content1/90 border border-border backdrop-blur-sm relative">
        <CardBody className="p-0">
          <SkeletonAccountCard />
        </CardBody>
      </Card>
    );
  }

  // If we don't have a selected account yet, show nothing
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
    const amountValue = parseFloat(amount);
    return amountValue > 0 && amountValue <= (selectedAccount.balance || 0);
  };

  const handleSelectToAccount = () => {
    // Find the first eligible account that's not the selected account
    const eligibleAccount = accounts.find(
      (account) => account.address !== selectedAccount?.address && !account.isDisabled
    );
    if (eligibleAccount) {
      setToAccount(eligibleAccount);
    }
  };

  const handleTransfer = () => {
    if (!selectedAccount || !toAccount || !isAmountValid()) return;

    // Update balances optimistically and then refresh from blockchain
    if (selectedAccount && toAccount) {
      updateAccountBalancesAfterTransfer(selectedAccount.address, toAccount.address, amount);
    }

    // Close the send modal and reset the transfer state
    setIsSendModalOpen(false);
    setAmount("");
    setToAccount(null);
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

  return (
    <>
      {/* Send Modal */}
      <SendModal
        isOpen={isSendModalOpen}
        onClose={() => {
          setIsSendModalOpen(false);
          setAmount("");
          setToAccount(null);
        }}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
        toAccount={toAccount}
        setToAccount={setToAccount}
        amount={amount}
        setAmount={setAmount}
        onSelectToAccount={handleSelectToAccount}
        isAmountValid={isAmountValid}
        onTransfer={handleTransfer}
        onCancel={() => {
          setIsSendModalOpen(false);
          setAmount("");
          setToAccount(null);
        }}
        availableAccounts={accounts.filter((account) => account.address !== selectedAccount?.address)}
      />

      {/* Receive Modal */}
      <ReceiveModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        availableAccounts={enabledAccounts}
        selectedAccount={selectedAccount}
        selectedSettlementAccount={accounts[0]}
        onChangeSettlementAccount={setSelectedAccount}
      />

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
              onToggleExpand={() => {
                console.log("Toggle expand called");
                setIsExpanded(!isExpanded);
              }}
              isLoading={isLoadingAccounts}
            />

            <div
              className={`
                transform transition-all duration-300 ease-in-out
                ${isExpanded ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0"}
                overflow-hidden
              `}
            >
              <div className="p-6 space-y-6 border-t border-border">
                <div onClick={(e) => e.stopPropagation()}>
                  <AccountBalance
                    account={selectedAccount}
                    onReceive={handleReceive}
                    onSend={handleSend}
                    isLoading={isLoadingAccounts}
                  />
                </div>

                <AccountNavigation selectedTab={activeTab} onTabChange={setActiveTab} />

                <div>
                  {activeTab === "activity" && (
                    <ActivityView activities={selectedAccount.recentActivity} isLoading={isLoadingAccounts} />
                  )}
                  {activeTab === "signers" && (
                    <SignersView signers={selectedAccount.signers} isLoading={isLoadingAccounts} />
                  )}
                  {activeTab === "policies" && (
                    <PoliciesView signers={selectedAccount.signers} isLoading={isLoadingAccounts} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

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
    </>
  );
}

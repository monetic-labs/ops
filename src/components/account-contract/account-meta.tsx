"use client";

import type { Account, Signer } from "@/types/account";

import { useState } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { toast } from "sonner";

import { useAccounts } from "@/contexts/AccountContext";

import { SkeletonAccountCard } from "./components/SkeletonLoaders";
import { AccountHeader } from "./components/AccountHeader";
import { AccountBalance } from "./components/AccountBalance";
import { AccountNavigation } from "./components/AccountNavigation";
import { DeployAccountModal } from "./modals/DeployAccountModal";
import { ActivityView } from "./views/ActivityView";
import { SignersView } from "./views/SignersView";
import { PoliciesView } from "./views/PoliciesView";
import { InvestmentsView } from "./views/InvestmentsView";
import { SendModal } from "./modals/SendModal";
import { ReceiveModal } from "./modals/ReceiveModal";
import { AccountSelectionModal } from "./modals/AccountSelectionModal";
import { CreateInvestmentPlanModal } from "./modals/CreateInvestmentPlanModal";

export default function AccountMeta() {
  const {
    accounts,
    selectedAccount,
    isLoadingAccounts,
    totalBalance,
    getEnabledAccounts,
    setSelectedAccount,
    registerSubAccount,
    refreshAccounts,
    updateAccountBalancesAfterTransfer,
    deployAccount,
  } = useAccounts();

  const [activeTab, setActiveTab] = useState<string>("activity");
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isCreateInvestmentModalOpen, setIsCreateInvestmentModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedSigners, setSelectedSigners] = useState<Signer[]>([]);
  const [threshold, setThreshold] = useState(1);
  const [isAccountSelectionOpen, setIsAccountSelectionOpen] = useState(false);

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

  const enabledAccounts = getEnabledAccounts();

  const handleSend = () => {
    setIsSendModalOpen(true);
  };

  const handleReceive = () => {
    setIsReceiveModalOpen(true);
  };

  const handleInvest = () => {
    setIsCreateInvestmentModalOpen(true);
  };

  const handleCreateInvestmentPlan = () => {
    setIsCreateInvestmentModalOpen(true);
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

  const handleTransfer = async () => {
    if (!selectedAccount || !toAccount || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsSendModalOpen(false);

    try {
      // Log transaction start
      console.log("Starting transfer transaction...");
      console.log(`From: ${selectedAccount.name} (${selectedAccount.address})`);
      console.log(`To: ${toAccount.name} (${toAccount.address})`);
      console.log(`Amount: ${amount} USDC`);

      // Call the updateAccountBalancesAfterTransfer function to update account balances
      // This will optimistically update the UI without waiting for network confirmation
      updateAccountBalancesAfterTransfer(selectedAccount.address, toAccount.address, amount);

      // Reset transfer state
      setAmount("");
      setToAccount(null);
    } catch (error) {
      console.error("Error in transfer transaction:", error);
      toast.error("Transfer failed. Please try again.");
    }
  };

  const handleDeploy = async (): Promise<void> => {
    if (!selectedAccount) return;

    try {
      await deployAccount(selectedAccount.id, selectedSigners, threshold);
    } catch (error) {
      console.error("Failed to deploy account:", error);
      throw error;
    }
  };

  const handleCreatePlan = async (plan: {
    assetId: string;
    amount: number;
    frequency: string;
    startDate: Date;
    endDate?: Date;
  }): Promise<void> => {
    console.log("Creating investment plan:", plan);
    // In a real implementation, this would call an API to create the plan
    setIsCreateInvestmentModalOpen(false);
    // If the investments tab isn't active, switch to it
    if (activeTab !== "investments") {
      setActiveTab("investments");
    }
  };

  return (
    <>
      {/* Send Modal */}
      <SendModal
        amount={amount}
        availableAccounts={accounts.filter((account) => account.address !== selectedAccount?.address)}
        isAmountValid={isAmountValid}
        isOpen={isSendModalOpen}
        selectedAccount={selectedAccount}
        setAmount={setAmount}
        setSelectedAccount={setSelectedAccount}
        setToAccount={setToAccount}
        toAccount={toAccount}
        onCancel={() => {
          setIsSendModalOpen(false);
          setAmount("");
          setToAccount(null);
        }}
        onClose={() => {
          setIsSendModalOpen(false);
          setAmount("");
          setToAccount(null);
        }}
        onSelectToAccount={handleSelectToAccount}
        onTransfer={handleTransfer}
      />

      {/* Receive Modal */}
      <ReceiveModal
        availableAccounts={enabledAccounts}
        isOpen={isReceiveModalOpen}
        selectedAccount={selectedAccount}
        selectedSettlementAccount={accounts[0]}
        onChangeSettlementAccount={setSelectedAccount}
        onClose={() => setIsReceiveModalOpen(false)}
      />

      {/* Create Investment Plan Modal */}
      <CreateInvestmentPlanModal
        isOpen={isCreateInvestmentModalOpen}
        onClose={() => setIsCreateInvestmentModalOpen(false)}
        account={selectedAccount}
        onCreatePlan={handleCreatePlan}
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
              Activate Account
            </button>
          </div>
        )}

        <CardBody className="p-0">
          <div className="flex flex-col">
            <AccountHeader
              accounts={accounts}
              isExpanded={isExpanded}
              isLoading={isLoadingAccounts}
              selectedAccount={selectedAccount}
              totalBalance={totalBalance}
              onAccountSelect={handleAccountSelect}
              onToggleExpand={() => {
                console.log("Toggle expand called");
                setIsExpanded(!isExpanded);
              }}
            />

            <div
              className={`
                transform transition-all duration-300 ease-in-out
                ${isExpanded ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0"}
                overflow-hidden
              `}
            >
              <div className="p-6 space-y-6 border-t border-border">
                <AccountBalance
                  account={selectedAccount}
                  isLoading={isLoadingAccounts}
                  onReceive={handleReceive}
                  onSend={handleSend}
                />

                <AccountNavigation selectedTab={activeTab} onTabChange={setActiveTab} />

                <div>
                  {activeTab === "activity" && (
                    <ActivityView activities={selectedAccount.recentActivity} isLoading={isLoadingAccounts} />
                  )}
                  {activeTab === "signers" && (
                    <SignersView
                      account={selectedAccount}
                      isLoading={isLoadingAccounts}
                      signers={selectedAccount.signers}
                    />
                  )}
                  {activeTab === "policies" && (
                    <PoliciesView isLoading={isLoadingAccounts} signers={selectedAccount.signers} />
                  )}
                  {activeTab === "investments" && (
                    <InvestmentsView
                      account={selectedAccount}
                      isLoading={isLoadingAccounts}
                      onCreateInvestmentPlan={handleCreateInvestmentPlan}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <DeployAccountModal
        accounts={accounts}
        isOpen={isDeployModalOpen}
        selectedAccount={selectedAccount}
        selectedSigners={selectedSigners}
        setSelectedSigners={setSelectedSigners}
        setThreshold={setThreshold}
        threshold={threshold}
        onClose={() => setIsDeployModalOpen(false)}
        onDeploy={handleDeploy}
      />

      <AccountSelectionModal
        accounts={accounts.filter((acc) => !acc.isDisabled && !acc.isComingSoon)}
        isOpen={isAccountSelectionOpen}
        selectedAccountId={selectedAccount.id}
        title="Select Account"
        onClose={() => setIsAccountSelectionOpen(false)}
        onSelect={handleAccountSelect}
      />
    </>
  );
}

"use client";

import type { Account, Signer } from "@/types/account";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { toast } from "sonner";
import { CreditCard, MessageCircle } from "lucide-react";

import { useAccounts } from "@/contexts/AccountContext";
import { useShortcuts } from "@/components/generics/shortcuts-provider";
import { useSupportService } from "@/hooks/messaging/useSupportService";

import { SkeletonAccountCard } from "./components/SkeletonLoaders";
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
  const { openChat } = useShortcuts();
  const { sendMessage } = useSupportService();

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
      // Refresh accounts to get the latest balances
      await refreshAccounts(true);
    } catch (error) {
      console.error("Error refreshing accounts after transfer:", error);
      toast.error("Failed to refresh account balances. Please reload the page.");
    }

    // Reset transfer state
    setAmount("");
    setToAccount(null);
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

  const handleSupportClick = async () => {
    openChat();
    await sendMessage("Hi, I need help with my Rain Card account.");
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

      <Card className="w-full bg-content1/90 border border-border backdrop-blur-sm relative">
        {selectedAccount && !selectedAccount.isDeployed && (
          <div className="absolute inset-0 bg-content1/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
            {selectedAccount.isCard ? (
              <>
                <div className="bg-warning/10 p-3 rounded-full mb-4">
                  <CreditCard className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Rain Card Account</h3>
                <p className="text-foreground/60 mb-4 max-w-md">
                  This account is managed by Rain. For support or inquiries about your Rain Card, please contact our
                  support team.
                </p>
                <button
                  onClick={handleSupportClick}
                  className="bg-warning text-warning-foreground px-4 py-2 rounded-md hover:bg-warning/80 transition-colors inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact Support
                </button>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-semibold mb-2">Activate your account</h3>
                <p className="text-foreground/60 mb-4">This account needs to be activated before it can be used.</p>
                <button
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/80 transition-colors"
                  onClick={() => setIsDeployModalOpen(true)}
                >
                  Activate Account
                </button>
              </>
            )}
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

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardBody } from "@heroui/card";
import { CreditCard, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Account as AccountType, Signer } from "@/types/account";

import { useAccounts } from "@/contexts/AccountContext";
import { useShortcuts } from "@/components/generics/shortcuts-provider";
import { useSupportService } from "@/hooks/messaging/useSupportService";

import { SkeletonAccountCard } from "./SkeletonLoaders";
import { AccountHeader } from "./AccountHeader";
import { AccountBalance } from "./AccountBalance";
import { AccountNavigation } from "./AccountNavigation";

import { ActivityView } from "../_views/ActivityView";
import { SignersView } from "../_views/SignersView";
import { PoliciesView } from "../_views/PoliciesView";

import { SendModal } from "../_modals/SendModal";
import { ReceiveModal } from "../_modals/ReceiveModal";
import { DeployAccountModal } from "../_modals/DeployAccountModal";
import { AccountSelectionModal } from "../_modals/AccountSelectionModal";

interface AccountProps {
  account: AccountType;
  isLoading: boolean;
}

export function Account({ account: selectedAccount, isLoading }: AccountProps) {
  const router = useRouter();
  const {
    accounts,
    totalBalance,
    getEnabledAccounts,
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
  const [toAccount, setToAccount] = useState<AccountType | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedSigners, setSelectedSigners] = useState<Signer[]>([]);
  const [threshold, setThreshold] = useState(1);
  const [isAccountSelectionOpen, setIsAccountSelectionOpen] = useState(false);

  // If we're loading accounts but don't have any yet, show the full skeleton
  if (isLoading && accounts.length === 0) {
    return (
      <Card className="w-full bg-content1/90 border border-border backdrop-blur-sm relative">
        <CardBody className="p-0">
          <SkeletonAccountCard />
        </CardBody>
      </Card>
    );
  }

  const enabledAccounts = getEnabledAccounts();

  const handleSend = () => {
    setIsSendModalOpen(true);
  };

  const handleReceive = () => {
    setIsReceiveModalOpen(true);
  };

  const handleAccountSelect = (account: AccountType) => {
    router.push(`/account/${account.id}`);
    setIsExpanded(true);
    setIsAccountSelectionOpen(false);
  };

  const isAmountValid = () => {
    if (!amount || !selectedAccount) return false;
    const amountValue = parseFloat(amount);
    return amountValue > 0 && amountValue <= (selectedAccount.balance || 0);
  };

  const handleSelectToAccount = () => {
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
      await refreshAccounts(true);
    } catch (error) {
      console.error("Error refreshing accounts after transfer:", error);
      toast.error("Failed to refresh account balances. Please reload the page.");
    }

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
      <SendModal
        amount={amount}
        availableAccounts={accounts.filter((account) => account.address !== selectedAccount?.address)}
        isAmountValid={isAmountValid}
        isOpen={isSendModalOpen}
        selectedAccount={selectedAccount}
        setAmount={setAmount}
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

      <ReceiveModal
        availableAccounts={enabledAccounts}
        isOpen={isReceiveModalOpen}
        selectedAccount={selectedAccount}
        selectedSettlementAccount={accounts[0]}
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
              isLoading={isLoading}
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
                  isLoading={isLoading}
                  onReceive={handleReceive}
                  onSend={handleSend}
                />

                <AccountNavigation selectedTab={activeTab} onTabChange={setActiveTab} />

                <div>
                  {activeTab === "activity" && (
                    <ActivityView activities={selectedAccount.recentActivity} isLoading={isLoading} />
                  )}
                  {activeTab === "signers" && (
                    <SignersView account={selectedAccount} isLoading={isLoading} signers={selectedAccount.signers} />
                  )}
                  {activeTab === "policies" && <PoliciesView isLoading={isLoading} signers={selectedAccount.signers} />}
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

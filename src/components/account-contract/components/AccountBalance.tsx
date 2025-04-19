import type { Account } from "@/types/account";

import { Button } from "@heroui/button";
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { PersonRole } from "@monetic-labs/sdk";
import { useState, useMemo } from "react";

import { useUser } from "@/contexts/UserContext";
import { formatAmountUSD, isProduction } from "@/utils/helpers";
import { useSigners } from "@/contexts/SignersContext";
import { MAIN_ACCOUNT } from "@/utils/constants";
import { FaucetModal } from "../modals/FaucetModal";
import { useAccounts } from "@/contexts/AccountContext";
import { Tooltip } from "@heroui/tooltip";

interface AccountBalanceProps {
  account: Account;
  onSend: () => void;
  onReceive: () => void;
  isLoading?: boolean;
}

export function AccountBalance({ account, onSend, onReceive, isLoading = false }: AccountBalanceProps) {
  const { user } = useUser();
  const { signers } = useSigners();
  const [showFaucetModal, setShowFaucetModal] = useState(false);
  const { refreshAccounts, isLoadingAccounts } = useAccounts();

  const isMember = user?.role === PersonRole.MEMBER;
  const isSigner =
    user?.walletAddress && signers.some((s) => s.address.toLowerCase() === user.walletAddress?.toLowerCase());

  // Check if this is the operating account
  const isOperatingAccount = account.name.toLowerCase() === MAIN_ACCOUNT;

  // Only show the Request Funds button for the operating account in non-production environments
  const showRequestFundsButton = !isProduction && isOperatingAccount && account.isDeployed;

  // Memoize the formatted balance to ensure it updates with account changes
  const formattedBalance = useMemo(() => formatAmountUSD(account.balance), [account.balance]);

  const handleRequestFunds = () => {
    if (!account.isDeployed) return;
    setShowFaucetModal(true);
  };

  const handleRefresh = () => {
    refreshAccounts(true);
  };

  if (isLoading) {
    return (
      <div className="bg-content2 p-4 md:p-6 rounded-xl mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="h-4 w-32 bg-content3 rounded-md animate-pulse mb-2" />
            <div className="h-10 w-40 bg-content3 rounded-md animate-pulse mt-1" />
            <div className="h-4 w-16 bg-content3 rounded-md animate-pulse mt-2" />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button disabled className="flex-1 md:flex-none h-11 bg-content3 animate-pulse">
              <div className="h-4 w-16 bg-content4 rounded-md" />
            </Button>
            <Button disabled className="flex-1 md:flex-none h-11 bg-content3 animate-pulse">
              <div className="h-4 w-16 bg-content4 rounded-md" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!account.isDeployed) {
    return (
      <div className="bg-content2 p-4 md:p-6 rounded-xl mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <p className="text-sm text-warning mb-1">Account Not Activated</p>
            <p className="text-3xl md:text-4xl font-semibold mt-1 text-foreground/40">$0.00</p>
            <p className="text-sm text-foreground/40 mt-1">{account.currency}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto opacity-50">
            <Button
              isDisabled
              className="flex-1 md:flex-none h-11 bg-content3 text-foreground px-6"
              startContent={<ArrowUpRight className="w-4 h-4" />}
            >
              Send
            </Button>
            <Button
              isDisabled
              className="flex-1 md:flex-none h-11 bg-content3 text-foreground px-6"
              startContent={<ArrowDownLeft className="w-4 h-4" />}
            >
              Receive
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-content2 p-4 md:p-6 rounded-xl mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/60">Available Balance</span>
              <Tooltip content="Refresh balance" placement="right">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-foreground/40 data-[hover=true]:text-foreground/80 -ml-1"
                  onPress={handleRefresh}
                  isLoading={isLoadingAccounts}
                  aria-label="Refresh balance"
                >
                  <RefreshCw size={14} />
                </Button>
              </Tooltip>
            </div>
            <p className="text-3xl md:text-4xl font-semibold mt-1">{formattedBalance}</p>
            <p className="text-sm text-foreground/40 mt-1">{account.currency}</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {showRequestFundsButton && (
              <Button
                className="flex-1 md:flex-none h-11 bg-primary text-primary-foreground hover:bg-primary/90 px-6"
                startContent={<ArrowUpRight className="w-4 h-4" />}
                onPress={handleRequestFunds}
              >
                Faucet
              </Button>
            )}
            <Button
              className="flex-1 md:flex-none h-11 bg-primary/10 text-primary hover:bg-primary/20 px-6"
              startContent={<ArrowUpRight className="w-4 h-4" />}
              onPress={onSend}
            >
              Send
            </Button>
            <Button
              className="flex-1 md:flex-none h-11 bg-primary/10 text-primary hover:bg-primary/20 px-6"
              startContent={<ArrowDownLeft className="w-4 h-4" />}
              onPress={onReceive}
            >
              Receive
            </Button>
          </div>
        </div>
      </div>

      <FaucetModal
        isOpen={showFaucetModal}
        onClose={() => setShowFaucetModal(false)}
        accountAddress={account.address}
      />
    </>
  );
}

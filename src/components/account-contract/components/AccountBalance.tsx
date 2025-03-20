import type { Account } from "@/types/account";

import { Button } from "@nextui-org/button";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { PersonRole } from "@backpack-fux/pylon-sdk";

import { useUser } from "@/contexts/UserContext";
import { formatAmountUSD, isProduction } from "@/utils/helpers";
import { useSigners } from "@/contexts/SignersContext";
import { MAIN_ACCOUNT } from "@/utils/constants";

interface AccountBalanceProps {
  account: Account;
  onSend: () => void;
  onReceive: () => void;
  isLoading?: boolean;
}

export function AccountBalance({ account, onSend, onReceive, isLoading = false }: AccountBalanceProps) {
  const { user } = useUser();
  const { signers } = useSigners();

  const isMember = user?.role === PersonRole.MEMBER;
  const isSigner =
    user?.walletAddress && signers.some((s) => s.address.toLowerCase() === user.walletAddress?.toLowerCase());

  // Check if this is the operating account
  const isOperatingAccount = account.name.toLowerCase() === MAIN_ACCOUNT;

  // Only show the Request Funds button for the operating account in non-production environments
  const showRequestFundsButton = !isProduction && isOperatingAccount && account.isDeployed;

  const requestFunds = () => {
    if (!account.isDeployed) return;

    // Redirect to Circle's faucet website
    // The Circle faucet doesn't support URL parameters for pre-filling the address,
    // so we'll just redirect to the main page
    window.open("https://faucet.circle.com", "_blank");
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
    <div className="bg-content2 p-4 md:p-6 rounded-xl mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <p className="text-sm text-foreground/60">Available Balance</p>
          <p className="text-3xl md:text-4xl font-semibold mt-1">{formatAmountUSD(account.balance)}</p>
          <p className="text-sm text-foreground/40 mt-1">{account.currency}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {showRequestFundsButton && (
            <Button
              className="flex-1 md:flex-none h-11 bg-primary text-primary-foreground hover:bg-primary/90 px-6"
              startContent={<ArrowUpRight className="w-4 h-4" />}
              onPress={requestFunds}
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
  );
}

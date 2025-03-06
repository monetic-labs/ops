import type { Account } from "@/types/account";

import { Button } from "@nextui-org/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";

import { formatAmountUSD } from "@/utils/helpers";

interface AccountHeaderProps {
  selectedAccount: Account;
  accounts: Account[];
  onAccountSelect: (account: Account) => void;
  totalBalance: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isLoading?: boolean;
}

export function AccountHeader({
  selectedAccount,
  accounts,
  onAccountSelect,
  totalBalance,
  isExpanded,
  onToggleExpand,
  isLoading = false,
}: AccountHeaderProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      onToggleExpand();
    }
  };

  // Sort accounts to put enabled accounts first
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.isDisabled === b.isDisabled) return 0;

    return a.isDisabled ? 1 : -1;
  });

  // Calculate total balance only from enabled accounts
  const enabledTotalBalance = accounts
    .filter((acc) => acc.isDeployed)
    .reduce((sum, acc) => sum + (acc.balance || 0), 0);

  // Check if settlement account is enabled
  const settlementAccount = accounts.find((acc) => acc.isSettlement);
  const isSettlementEnabled = settlementAccount?.isDeployed;

  // Determine if account can be selected
  const canSelectAccount = (account: Account) => {
    if (account.isDeployed) return true;
    if (account.isComingSoon || account.isDisabled) return false;

    return isSettlementEnabled;
  };

  return (
    <>
      {/* eslint-disable */}
      <div
        className={`
          sticky top-0 z-20 flex flex-col md:flex-row md:items-center gap-4 md:gap-0 
          justify-between p-4 md:px-8 md:py-5 bg-content1/80 backdrop-blur-md 
          cursor-pointer hover:bg-content2/50 transition-all duration-200
          ${!isExpanded ? "border-b border-border" : ""}
        `}
        onClick={onToggleExpand}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="flex items-center gap-4">
          <Dropdown isDisabled={isLoading}>
            <DropdownTrigger>
              <Button
                className={`
                  w-full md:w-auto px-3 md:px-4 py-2 h-auto bg-content2 
                  hover:bg-content3 shadow-card hover:shadow-hover transition-all duration-200 
                  border ${!selectedAccount.isDeployed ? "border-warning/50" : "border-border"}
                  ${isLoading ? "opacity-80" : ""}
                `}
                variant="light"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 md:p-2 rounded-xl ${
                      !selectedAccount.isDeployed ? "bg-warning/10" : "bg-primary/10"
                    } ${isLoading ? "animate-pulse" : ""}`}
                  >
                    <selectedAccount.icon
                      className={`w-4 h-4 md:w-5 md:h-5 ${
                        !selectedAccount.isDeployed ? "text-warning" : "text-primary"
                      }`}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      {isLoading ? (
                        <div className="h-6 w-24 bg-content3 rounded-md animate-pulse"></div>
                      ) : (
                        <span className="text-base md:text-lg font-semibold">{selectedAccount.name}</span>
                      )}
                    </div>
                    {isLoading ? (
                      <div className="h-4 w-20 bg-content3 rounded-md mt-1 animate-pulse"></div>
                    ) : (
                      <span className="text-xs md:text-sm text-primary/80">
                        {!selectedAccount.isDeployed ? (
                          <span className="text-warning">Activation Required</span>
                        ) : (
                          "Select Account"
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Account selection"
              disabledKeys={sortedAccounts.filter((account) => !canSelectAccount(account)).map((account) => account.id)}
              onAction={(key) => {
                const account = accounts.find((acc) => acc.id === key);
                if (account && canSelectAccount(account)) {
                  onAccountSelect(account);
                }
              }}
            >
              {sortedAccounts.map((account) => (
                <DropdownItem
                  key={account.id}
                  className={`transition-colors duration-200 ${
                    !canSelectAccount(account) ? "opacity-50 cursor-not-allowed" : "hover:bg-content3"
                  }`}
                  startContent={
                    <div
                      className={`p-1.5 rounded-lg ${
                        account.isDisabled ? "bg-content3" : !account.isDeployed ? "bg-warning/10" : "bg-primary/10"
                      }`}
                    >
                      <account.icon
                        className={`w-4 h-4 ${
                          account.isDisabled
                            ? "text-foreground/40"
                            : !account.isDeployed
                              ? "text-warning"
                              : "text-primary"
                        }`}
                      />
                    </div>
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{account.name}</span>
                      <span
                        className={`text-xs ${
                          account.isComingSoon
                            ? "text-foreground/40"
                            : !account.isDeployed
                              ? "text-warning"
                              : "text-foreground/60"
                        }`}
                      >
                        {account.isComingSoon
                          ? "Coming Soon"
                          : !account.isDeployed && !isSettlementEnabled
                            ? "Activation Required"
                            : formatAmountUSD(account.balance)}
                      </span>
                    </div>
                  </div>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1">
          <span className="text-md md:text-md text-foreground/60">Total Balance</span>
          {isLoading ? (
            <div className="h-8 w-28 bg-content3 rounded-md animate-pulse"></div>
          ) : (
            <p className="text-lg md:text-2xl font-semibold">{formatAmountUSD(enabledTotalBalance)}</p>
          )}
        </div>
      </div>

      {/* Dropdown Indicator */}
      <div
        className={`
          h-1 bg-gradient-to-b from-border/5 to-border/20
          transition-all duration-200 ease-in-out
          ${isExpanded ? "opacity-0" : "opacity-100"}
        `}
      />
    </>
  );
}

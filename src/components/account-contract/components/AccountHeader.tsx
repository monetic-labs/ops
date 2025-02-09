import { Button } from "@nextui-org/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { ChevronDown } from "lucide-react";
import { Account } from "@/contexts/AccountContext";
import { formatUSD } from "@/utils/formatters/currency";

interface AccountHeaderProps {
  selectedAccount: Account;
  accounts: Account[];
  onAccountSelect: (account: Account) => void;
  totalBalance: string;
}

export function AccountHeader({ selectedAccount, accounts, onAccountSelect, totalBalance }: AccountHeaderProps) {
  return (
    <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center gap-4 md:gap-0 justify-between p-4 md:px-8 md:py-5 border-b border-border bg-content1/80 backdrop-blur-md">
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant="light"
            className="w-full md:w-auto px-3 md:px-4 py-2 h-auto bg-content2 hover:bg-content3 shadow-card hover:shadow-hover transition-all duration-200 border border-border"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 md:p-2 rounded-xl bg-primary/10">
                <selectedAccount.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base md:text-lg font-semibold">{selectedAccount.name}</span>
                <span className="text-xs md:text-sm text-primary/80">Select Account</span>
              </div>
              <ChevronDown className="w-4 h-4 text-primary ml-auto md:ml-2" />
            </div>
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Account selection"
          onAction={(key) => {
            const account = accounts.find((acc) => acc.id === key);
            if (account && !account.disabled) {
              onAccountSelect(account);
            }
          }}
          classNames={{
            base: "p-0",
          }}
        >
          {accounts.map((account) => (
            <DropdownItem
              key={account.id}
              startContent={
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <account.icon className="w-4 h-4 text-primary" />
                </div>
              }
              endContent={account.disabled && <span className="text-xs text-foreground/40">Coming Soon</span>}
              className={`transition-colors duration-200 ${
                account.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-content3"
              }`}
              isDisabled={account.disabled}
            >
              <div className="flex flex-col">
                <span className="font-medium">{account.name}</span>
                <span className="text-xs text-foreground/60">${account.balance?.toLocaleString()}</span>
              </div>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1">
        <span className="text-xs md:text-sm text-foreground/60">Total Balance</span>
        <p className="text-lg md:text-2xl font-semibold">{formatUSD(parseFloat(totalBalance))}</p>
      </div>
    </div>
  );
}

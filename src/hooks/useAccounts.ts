import { useState } from "react";
import { Building2, CreditCard, PlusCircle, PiggyBank } from "lucide-react";

import { Account } from "@/types/account";
import { useAccounts as useAuthAccounts } from "@/contexts/AccountContext";

// Temporary mock data until we have real implementation
const MOCK_ACCOUNTS: Account[] = [
  {
    id: "settlement",
    name: "Settlement",
    currency: "USD",
    balance: 456104.2,
    icon: Building2,
  },
  {
    id: "rain",
    name: "Rain Card",
    currency: "USD",
    balance: 31383.43,
    icon: CreditCard,
  },
  {
    id: "savings",
    name: "Savings",
    currency: "USD",
    balance: 0,
    disabled: true,
    comingSoon: true,
    icon: PiggyBank,
  },
  {
    id: "new-account",
    name: "New Account",
    currency: "USD",
    disabled: true,
    comingSoon: true,
    isCreateAccount: true,
    icon: PlusCircle,
  },
];

export function useAccounts() {
  const { user } = useAuthAccounts();
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState<Account>(accounts[0]);

  const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);

  const getEnabledAccounts = () => accounts.filter((account) => !account.disabled);

  return {
    accounts,
    selectedAccount,
    setSelectedAccount,
    totalBalance: totalBalance.toString(),
    getEnabledAccounts,
    user,
  };
}

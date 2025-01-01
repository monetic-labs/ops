"use client";
import { createContext, useContext, ReactNode } from "react";
import { Building2, CreditCard, PiggyBank, PlusCircle } from "lucide-react";

export interface Account {
  id: string;
  name: string;
  currency: string;
  balance?: number;
  icon?: any;
  disabled?: boolean;
  comingSoon?: boolean;
  isCreateAccount?: boolean;
}

interface User {
  name: string;
}

interface Merchant {
  name: string;
}

interface AccountContextType {
  accounts: Account[];
  getEnabledAccounts: () => Account[];
  getAccountById: (id: string) => Account | undefined;
  user?: User;
  merchant?: Merchant;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const accounts: Account[] = [
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

  const getEnabledAccounts = () => accounts.filter((acc) => !acc.disabled);
  const getAccountById = (id: string) => accounts.find((acc) => acc.id === id);

  // Mock data for now - replace with real data later
  const user = { name: "John Doe" };
  const merchant = { name: "Acme Corp" };

  return (
    <AccountContext.Provider value={{ accounts, getEnabledAccounts, getAccountById, user, merchant }}>
      {children}
    </AccountContext.Provider>
  );
}

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccounts must be used within an AccountProvider");
  }
  return context;
};

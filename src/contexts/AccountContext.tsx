"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Building2, CreditCard, PiggyBank, PlusCircle } from "lucide-react";

import pylon from "@/libs/pylon-sdk";
import { MerchantUserGetByIdOutput as MerchantUser } from "@backpack-fux/pylon-sdk";
import { LocalStorage } from "@/utils/localstorage";

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

export interface ExtendedMerchantUser extends MerchantUser {
  profileImage?: string | null;
}

interface AccountContextType {
  accounts: Account[];
  getEnabledAccounts: () => Account[];
  getAccountById: (id: string) => Account | undefined;
  user: ExtendedMerchantUser | undefined;
  merchant: { name: string } | undefined;
  isAuthenticated: boolean;
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  getEnabledAccounts: () => [],
  getAccountById: () => undefined,
  user: undefined,
  merchant: undefined,
  isAuthenticated: false,
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedMerchantUser | undefined>(undefined);
  const [merchant, setMerchant] = useState<{ name: string } | undefined>(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await pylon.getUserById();
      const safeUser = LocalStorage.getSafeUser();

      // Create extended user object with profile image
      const extendedUser: ExtendedMerchantUser = {
        ...result,
        profileImage: safeUser?.profileImage || null,
      };

      setUser(extendedUser);
      setMerchant({ name: result.merchant.company.name });
    };

    fetchUser();
  }, []);

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

  // For now, we'll consider the user authenticated if we have both user and merchant data
  const isAuthenticated = Boolean(user && merchant);

  return (
    <AccountContext.Provider
      value={{
        accounts,
        getEnabledAccounts,
        getAccountById,
        user,
        merchant,
        isAuthenticated,
      }}
    >
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

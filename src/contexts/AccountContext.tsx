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
  isLoading: boolean;
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  getEnabledAccounts: () => [],
  getAccountById: () => undefined,
  user: undefined,
  merchant: undefined,
  isAuthenticated: false,
  isLoading: true,
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedMerchantUser | undefined>(undefined);
  const [merchant, setMerchant] = useState<{ name: string } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const safeUser = LocalStorage.getSafeUser();

  // Determine authentication state
  const isAuthenticated = Boolean(safeUser?.isLogin && user && merchant);

  useEffect(() => {
    const fetchUser = async () => {
      if (!safeUser?.isLogin) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await pylon.getUserById();

        // Create extended user object with profile image
        const extendedUser: ExtendedMerchantUser = {
          ...result,
          profileImage: safeUser?.profileImage || null,
        };

        setUser(extendedUser);
        setMerchant({ name: result.merchant.company.name });
      } catch (error) {
        console.error("Error fetching user data:", error);
        // If unauthorized, clear the safe user
        if ((error as any)?.response?.status === 401) {
          LocalStorage.clearAuthState();
          setUser(undefined);
          setMerchant(undefined);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [safeUser?.isLogin]);

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

  return (
    <AccountContext.Provider
      value={{
        accounts,
        getEnabledAccounts,
        getAccountById,
        user,
        merchant,
        isAuthenticated,
        isLoading,
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

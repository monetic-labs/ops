"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Building2, CreditCard, PiggyBank, PlusCircle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { MerchantUserGetByIdOutput as MerchantUser } from "@backpack-fux/pylon-sdk";
import { Address } from "viem";

import pylon from "@/libs/pylon-sdk";
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

export interface OnboardingState {
  passkeyId: string;
  credentialId: string;
  walletAddress: Address;
  settlementAddress: Address;
  publicKeyCoordinates: {
    x: string;
    y: string;
  };
}

interface AccountContextType {
  accounts: Account[];
  getEnabledAccounts: () => Account[];
  getAccountById: (id: string) => Account | undefined;
  user: ExtendedMerchantUser | undefined;
  merchant: { name: string } | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingState: OnboardingState | null;
  setOnboardingState: (state: OnboardingState | null) => void;
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  getEnabledAccounts: () => [],
  getAccountById: () => undefined,
  user: undefined,
  merchant: undefined,
  isAuthenticated: false,
  isLoading: true,
  onboardingState: null,
  setOnboardingState: () => {},
});

const PUBLIC_ROUTES = ["/auth", "/auth/recovery"];

export function AccountProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ExtendedMerchantUser | undefined>(undefined);
  const [merchant, setMerchant] = useState<{ name: string } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [safeUser, setSafeUser] = useState(LocalStorage.getSafeUser());
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(LocalStorage.getOnboardingState());

  // Determine authentication state
  const isAuthenticated = Boolean(safeUser?.isLogin && user && merchant);

  // Handle route protection
  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
    const isOnboardingRoute = pathname?.startsWith("/onboard");

    if (isLoading) return;

    if (!isPublicRoute && !isAuthenticated && !isOnboardingRoute) {
      router.replace("/auth");

      return;
    }

    if (isAuthenticated && isPublicRoute) {
      router.replace("/");

      return;
    }

    if (isOnboardingRoute && !onboardingState) {
      router.replace("/auth");

      return;
    }
  }, [isAuthenticated, isLoading, pathname, router, onboardingState]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newSafeUser = LocalStorage.getSafeUser();

      setSafeUser(newSafeUser);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStateChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStateChange", handleStorageChange);
    };
  }, []);

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
        onboardingState,
        setOnboardingState,
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

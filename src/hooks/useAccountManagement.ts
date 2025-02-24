import { useState, useEffect } from "react";
import { Building2, CreditCard, PiggyBank, type LucideIcon } from "lucide-react";
import {
  Network,
  StableCurrency,
  MerchantUserGetOutput,
  MerchantAccountGetOutput,
  PersonRole,
} from "@backpack-fux/pylon-sdk";
import { Address } from "viem";

import { Account } from "@/types/account";
import pylon from "@/libs/pylon-sdk";
import { useSigners } from "./useSigners";

interface AccountManagementState {
  accounts: Account[];
  selectedAccount: Account | null;
  isLoadingAccounts: boolean;
  lastFetched: number | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useAccountManagement() {
  const [state, setState] = useState<AccountManagementState>({
    accounts: [],
    selectedAccount: null,
    isLoadingAccounts: true,
    lastFetched: null,
  });

  const { signers, isLoading: isLoadingSigners, mapSignersToUsers, getAvailableSigners } = useSigners();

  const transformAccount = (account: MerchantAccountGetOutput): Account => {
    return {
      id: account.id,
      address: account.ledgerAddress as Address,
      name: account.name,
      currency: account.currency,
      balance: parseFloat(account.balance ?? "0"),
      icon: getAccountIcon(account.name),
      isDeployed: account.isDeployed,
      threshold: account.threshold ?? 0,
      signers: mapSignersToUsers(account.signers as Address[]),
      recentActivity: [],
      pendingActivity: [],
      isDisabled: false,
      isComingSoon: false,
      isCreateAccount: false,
    };
  };

  const fetchAccounts = async (force = false) => {
    // Return cached data if within cache duration
    if (!force && state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoadingAccounts: true }));
      const accounts = await pylon.getAccounts();
      const transformedAccounts = accounts.map(transformAccount);

      setState((prev) => ({
        ...prev,
        accounts: transformedAccounts,
        selectedAccount: transformedAccounts[0] || null,
        isLoadingAccounts: false,
        lastFetched: Date.now(),
      }));
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setState((prev) => ({
        ...prev,
        isLoadingAccounts: false,
      }));
    }
  };

  // Only fetch accounts when signers are loaded
  useEffect(() => {
    if (!isLoadingSigners) {
      fetchAccounts();
    }
  }, [isLoadingSigners]);

  const registerSubAccount = async (accountAddress: Address, accountName: string) => {
    try {
      const accountData = {
        name: accountName,
        ledgerAddress: accountAddress,
        network: Network.BASE,
        currency: StableCurrency.USDC,
      };

      const newAccount = await pylon.createAccount(accountData);
      const transformedAccount = transformAccount(newAccount);

      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts, transformedAccount],
        lastFetched: Date.now(), // Update cache timestamp
      }));

      return true;
    } catch (error) {
      console.error("Error registering sub-account:", error);
      throw new Error("Failed to register sub-account with backend");
    }
  };

  const unregisterSubAccount = async (accountId: string) => {
    try {
      // TODO: Implement account deletion with Pylon SDK
      await fetchAccounts(true); // Force refresh after unregistering
      return true;
    } catch (error) {
      console.error("Error unregistering sub-account:", error);
      return false;
    }
  };

  const getAccountIcon = (name: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      Treasury: Building2,
      Card: CreditCard,
      Savings: PiggyBank,
    };
    return iconMap[name] || Building2;
  };

  // Computed values
  const totalBalance = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  const enabledAccounts = state.accounts.filter((account) => !account.isDisabled);
  const getEnabledAccounts = () => state.accounts.filter((account) => account.isDeployed && !account.isDisabled);

  return {
    ...state,
    signers,
    isLoadingSigners,
    getAvailableSigners,
    totalBalance: totalBalance.toString(),
    enabledAccounts,
    setSelectedAccount: (account: Account) => setState((prev) => ({ ...prev, selectedAccount: account })),
    getEnabledAccounts,
    registerSubAccount,
    unregisterSubAccount,
    refreshAccounts: (force = true) => fetchAccounts(force),
  };
}

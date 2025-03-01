import { useState, useEffect } from "react";
import { Building2, CreditCard, PiggyBank, PlusCircle, type LucideIcon } from "lucide-react";
import {
  Network,
  StableCurrency,
  MerchantUserGetOutput,
  MerchantAccountGetOutput,
  PersonRole,
  GetVirtualAccountResponse,
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
  virtualAccount: GetVirtualAccountResponse | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Predefined accounts that are always shown
const PREDEFINED_ACCOUNTS: Account[] = [
  {
    id: "predefined-savings",
    name: "Savings",
    address: "0x0000000000000000000000000000000000000000",
    currency: StableCurrency.USDC,
    balance: 0,
    icon: PiggyBank,
    isDeployed: false,
    threshold: 0,
    signers: [],
    recentActivity: [],
    pendingActivity: [],
    isDisabled: true,
    isComingSoon: true,
    isCreateAccount: false,
    isSettlement: false,
    isCard: false,
  },
  {
    id: "predefined-new-account",
    name: "New Account",
    address: "0x0000000000000000000000000000000000000000",
    currency: StableCurrency.USDC,
    balance: 0,
    icon: PlusCircle,
    isDeployed: false,
    threshold: 0,
    signers: [],
    recentActivity: [],
    pendingActivity: [],
    isDisabled: true,
    isComingSoon: true,
    isCreateAccount: true,
    isSettlement: false,
    isCard: false,
  },
];

export function useAccountManagement() {
  const [state, setState] = useState<AccountManagementState>({
    accounts: [],
    selectedAccount: null,
    isLoadingAccounts: true,
    lastFetched: null,
    virtualAccount: null,
  });

  const { signers, isLoading: isLoadingSigners, mapSignersToUsers, getAvailableSigners } = useSigners();

  const transformAccount = (account: MerchantAccountGetOutput): Account => {
    const isSettlementAccount = account.name.toLowerCase() === "operating";
    const isCardAccount = account.name.toLowerCase() === "rain card";
    return {
      id: account.id,
      address: account.ledgerAddress as Address,
      rainControllerAddress: isCardAccount ? (account.controllerAddress as Address) : undefined,
      name: account.name,
      currency: account.currency,
      balance: parseFloat(account.balance ?? "0"),
      icon: getAccountIcon(account.name),
      isDeployed: account.isDeployed,
      threshold: account.threshold ?? 0,
      signers: mapSignersToUsers(account.signers as Address[]),
      isSettlement: isSettlementAccount,
      isCard: isCardAccount,
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
      return state.accounts;
    }

    try {
      setState((prev) => ({ ...prev, isLoadingAccounts: true }));
      // Fetch accounts and virtual account in parallel
      const [accounts, virtualAccount] = await Promise.all([
        pylon.getAccounts(),
        pylon.getVirtualAccount().catch(() => null),
      ]);
      const transformedAccounts = accounts.map(transformAccount);

      // Add predefined accounts with unique IDs
      const accountsWithPredefined = [...transformedAccounts, ...PREDEFINED_ACCOUNTS];
      setState((prev) => ({
        ...prev,
        accounts: accountsWithPredefined,
        selectedAccount: accountsWithPredefined[0] || null,
        isLoadingAccounts: false,
        lastFetched: Date.now(),
        virtualAccount,
      }));
      return accountsWithPredefined;
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setState((prev) => ({
        ...prev,
        isLoadingAccounts: false,
      }));
      return [];
    }
  };

  // Only fetch accounts when signers are loaded
  useEffect(() => {
    if (!isLoadingSigners) {
      fetchAccounts();
    }
  }, [isLoadingSigners]);

  const getSettlementAccount = () => {
    if (!state.virtualAccount?.destination?.address) return null;
    return state.accounts.find(
      (acc) => acc.address.toLowerCase() === state.virtualAccount?.destination?.address.toLowerCase()
    );
  };

  const fetchVirtualAccount = async () => {
    try {
      const virtualAccount = await pylon.getVirtualAccount();
      setState((prev) => ({ ...prev, virtualAccount }));

      // If we have a virtual account but no matching settlement account in our accounts list
      // we should refresh the accounts to make sure we have the latest data
      if (virtualAccount?.destination?.address) {
        const hasMatchingAccount = state.accounts.some(
          (acc) => acc.address.toLowerCase() === virtualAccount.destination.address.toLowerCase()
        );
        if (!hasMatchingAccount) {
          fetchAccounts(true);
        }
      }

      return virtualAccount;
    } catch (error) {
      console.error("Error fetching virtual account:", error);
      return null;
    }
  };

  const createVirtualAccount = async (destinationAddress: Address) => {
    try {
      const data = {
        source: {
          currency: "usd",
        },
        destination: {
          currency: "usdc",
          payment_rail: "base",
          address: destinationAddress,
        },
      };
      const virtualAccount = await pylon.createVirtualAccount(data);
      setState((prev) => ({ ...prev, virtualAccount }));
      return virtualAccount;
    } catch (error) {
      console.error("Error creating virtual account:", error);
      throw error;
    }
  };

  const updateVirtualAccountDestination = async (destinationAddress: Address) => {
    // Optimistically update the virtual account state
    setState((prev) => ({
      ...prev,
      virtualAccount: prev.virtualAccount
        ? {
            ...prev.virtualAccount,
            destination: {
              ...prev.virtualAccount.destination,
              address: destinationAddress,
            },
          }
        : null,
    }));

    // Fire and forget the API update
    const data = {
      destination: {
        address: destinationAddress,
      },
    };

    pylon.updateVirtualAccount(data).catch((error) => {
      console.error("Error updating virtual account (will be corrected on next page load):", error);
    });
  };

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

      // If this is the first operating account, create a virtual account
      const operatingAccount = state.accounts.find((acc) => acc.name.toLowerCase() === "operating" && acc.isDeployed);
      if (!operatingAccount && accountName.toLowerCase() === "operating") {
        await createVirtualAccount(accountAddress);
      }

      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts.filter((acc) => !acc.isComingSoon && !acc.isCreateAccount), transformedAccount],
        lastFetched: Date.now(),
      }));

      return true;
    } catch (error) {
      console.error("Error registering sub-account:", error);
      throw new Error("Failed to register sub-account with backend");
    }
  };

  // TODO: Implement account soft deletion with Pylon SDK
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
      operating: Building2,
      "rain card": CreditCard,
      savings: PiggyBank,
      "new account": PlusCircle,
    };
    return iconMap[name.toLowerCase()] || Building2;
  };

  // Computed values
  const totalBalance = state.accounts
    .filter((account) => !account.isComingSoon && !account.isCreateAccount)
    .reduce((sum, account) => sum + account.balance, 0);
  const enabledAccounts = state.accounts.filter((account) => !account.isDisabled);
  const getEnabledAccounts = () => state.accounts.filter((account) => account.isDeployed && !account.isDisabled);

  /**
   * Updates account balances after a transfer
   * First updates balances optimistically, then refreshes from blockchain
   * @param fromAddress The address of the account sending funds
   * @param toAddress The address of the account receiving funds
   * @param amount The amount being transferred as a string
   * @returns The updated accounts array
   */
  const updateAccountBalancesAfterTransfer = async (
    fromAddress: Address,
    toAddress: Address,
    amount: string
  ): Promise<Account[]> => {
    const amountValue = parseFloat(amount);

    // Update balances optimistically
    setState((prev) => {
      const updatedAccounts = prev.accounts.map((account) => {
        if (account.address === fromAddress) {
          return {
            ...account,
            balance: Math.max(0, account.balance - amountValue),
          };
        }
        if (account.address === toAddress) {
          return {
            ...account,
            balance: account.balance + amountValue,
          };
        }
        return account;
      });

      return {
        ...prev,
        accounts: updatedAccounts,
      };
    });

    // Schedule a single refresh after a delay
    setTimeout(() => {
      fetchAccounts(true).catch(console.error);
    }, 3000);

    return state.accounts;
  };

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
    updateAccountBalancesAfterTransfer,
    updateVirtualAccountDestination,
    virtualAccount: state.virtualAccount,
    getSettlementAccount,
  };
}

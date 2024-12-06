import { useState, useEffect, useCallback } from "react";
import { Address, formatUnits } from "viem";
import { useAppKitAccount } from "@reown/appkit/react";
import { useDebounce } from "use-debounce";

import { publicClient } from "@/config/web3";
import { BASE_USDC, MOCK_BALANCE, MOCK_SETTLEMENT_ADDRESS } from "@/utils/constants";
import { formatDecimals, isTesting } from "@/utils/helpers";

type UseBalanceProps = {
  amount: string;
  isModalOpen: boolean;
};

export const useBalance = ({ amount, isModalOpen }: UseBalanceProps) => {
  const [balance, setBalance] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [debouncedAmount] = useDebounce(amount, 500); // 500ms delay

  const appKitAccount = useAppKitAccount();
  const account = isTesting ? MOCK_SETTLEMENT_ADDRESS : appKitAccount.address;

  const getUserBalance = useCallback(async (): Promise<string> => {
    if (isTesting) return MOCK_BALANCE;
    if (!account) return "0";

    const balanceResult = await publicClient.readContract({
      address: BASE_USDC.ADDRESS,
      abi: BASE_USDC.ABI,
      functionName: "balanceOf",
      args: [account as Address],
    });
    const formattedBalance = formatUnits(balanceResult, BASE_USDC.DECIMALS);

    return formatDecimals(formattedBalance);
  }, [account]);

  const fetchBalance = useCallback(
    async (force = false) => {
      const now = Date.now();

      // Only fetch if it's been more than 1 minute since last fetch or if forced
      if (!force && now - lastFetchTime < 60000) return;

      try {
        setIsLoading(true);
        const newBalance = await getUserBalance();

        setBalance(newBalance);
        setLastFetchTime(now);
      } catch (error) {
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [getUserBalance, lastFetchTime]
  );

  // Initial fetch when modal opens
  useEffect(() => {
    if (isModalOpen && account && !balance) {
      fetchBalance(true);
    }
  }, [isModalOpen, account]);

  // Fetch on debounced amount change
  useEffect(() => {
    if (isModalOpen && account && debouncedAmount) {
      fetchBalance();
    }
  }, [debouncedAmount, isModalOpen, account]);

  // Periodic refresh
  useEffect(() => {
    if (!isModalOpen || !account) return;

    const intervalId = setInterval(() => {
      fetchBalance();
    }, 300_000); // 1 minute

    return () => clearInterval(intervalId);
  }, [isModalOpen, account]);

  return { balance, isLoading, error };
};

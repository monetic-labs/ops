import { useState, useEffect } from "react";
import { publicClient } from "@/config/web3";
import { BASE_USDC } from "@/utils/constants";
import { formatUnits } from "viem";
import { getAccount } from "@/utils/reown";
import { debounce } from "lodash";
import { formatDecimals } from "@/utils/helpers";

type UseBalanceProps = {
  amount: string;
  isModalOpen: boolean;
};

export const useBalance = ({ amount, isModalOpen }: UseBalanceProps) => {
  const [balance, setBalance] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getUserBalance = async (): Promise<string> => {
    const account = await getAccount();
    const balanceResult = await publicClient.readContract({
      address: BASE_USDC.ADDRESS,
      abi: BASE_USDC.ABI,
      functionName: "balanceOf",
      args: [account],
    });
    const formattedBalance = formatUnits(balanceResult, BASE_USDC.DECIMALS);
    return formatDecimals(formattedBalance);
  };

  const fetchBalance = async () => {
    try {
      setIsLoading(true);
      setBalance(await getUserBalance());
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchBalance(); // Fetch balance once when the amount changes
      const intervalId = setInterval(fetchBalance, 300_000); // Fetch balance every 5 minutes

      return () => clearInterval(intervalId); // Clear interval on unmount or when modal closes
    }
  }, [amount && isModalOpen]); // Trigger when amount changes and modal state is open

  return { balance, isLoading, error };
};

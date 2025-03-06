import { useState, useEffect, useCallback } from "react";
import { Address, formatUnits } from "viem";

import { publicClient } from "@/config/web3";
import { safeAbi } from "@/utils/abi/safe";
import { BASE_USDC } from "@/utils/constants";
import { formatDecimals } from "@/utils/helpers";
import { isContractDeployed } from "@/utils/safe";

interface SafeData {
  isDeployed: boolean;
  balance: number;
  threshold: number;
  signers: Address[];
  isLoading: boolean;
  error: Error | null;
}

export function useSafeData(safeAddress?: Address): SafeData & { refetch: () => Promise<void> } {
  const [data, setData] = useState<SafeData>({
    isDeployed: false,
    balance: 0,
    threshold: 0,
    signers: [],
    isLoading: true,
    error: null,
  });

  const fetchSafeData = useCallback(async () => {
    if (!safeAddress) {
      setData((prev) => ({ ...prev, isLoading: false }));

      return;
    }

    try {
      setData((prev) => ({ ...prev, isLoading: true }));

      // Check if contract is deployed using helper function
      const isDeployed = await isContractDeployed(safeAddress);

      if (!isDeployed) {
        setData((prev) => ({
          ...prev,
          isDeployed: false,
          isLoading: false,
        }));

        return;
      }

      // Fetch all safe data in one multicall
      const [balanceResult, decimalsResult, thresholdResult, signersResult] = await publicClient.multicall({
        contracts: [
          {
            address: BASE_USDC.ADDRESS,
            abi: BASE_USDC.ABI,
            functionName: "balanceOf",
            args: [safeAddress],
          },
          {
            address: BASE_USDC.ADDRESS,
            abi: BASE_USDC.ABI,
            functionName: "decimals",
          },
          {
            address: safeAddress,
            abi: safeAbi,
            functionName: "getThreshold",
          },
          {
            address: safeAddress,
            abi: safeAbi,
            functionName: "getOwners",
          },
        ],
      });

      // Handle potential failures in multicall results
      if (
        balanceResult.status === "failure" ||
        decimalsResult.status === "failure" ||
        thresholdResult.status === "failure" ||
        signersResult.status === "failure"
      ) {
        throw new Error("One or more multicall requests failed");
      }

      const balance = parseFloat(formatDecimals(formatUnits(balanceResult.result, decimalsResult.result)));

      setData({
        isDeployed: true,
        balance,
        threshold: Number(thresholdResult.result),
        signers: signersResult.result as Address[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching Safe data:", error);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [safeAddress]);

  useEffect(() => {
    fetchSafeData();
  }, [safeAddress]);

  return {
    ...data,
    refetch: fetchSafeData,
  };
}

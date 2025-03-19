import { useState, useEffect, useCallback } from "react";
import { Address, formatUnits } from "viem";

import { publicClient } from "@/config/web3";
import { SAFE_ABI } from "@/utils/abi/safe";
import { BASE_USDC } from "@/utils/constants";
import { formatDecimals } from "@/utils/helpers";
import { isContractDeployed } from "@/utils/safe";

export interface SafeData {
  isDeployed: boolean;
  balance: number;
  threshold: number;
  signers: Address[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Retrieves detailed information about a Safe account
 * Including deployment status, balance, threshold, and signers
 *
 * @param safeAddress The address of the Safe account to query
 * @returns A SafeData object with account information
 */
export async function getSafeData(safeAddress: Address): Promise<Omit<SafeData, "isLoading" | "error">> {
  try {
    // Check if contract is deployed
    const isDeployed = await isContractDeployed(safeAddress);

    if (!isDeployed) {
      return {
        isDeployed: false,
        balance: 0,
        threshold: 0,
        signers: [],
      };
    }

    // Fetch all safe data in one multicall
    const [balanceResult, decimalsResult, thresholdResult, signersResult, modulesResult] = await publicClient.multicall(
      {
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
            abi: SAFE_ABI,
            functionName: "getThreshold",
          },
          {
            address: safeAddress,
            abi: SAFE_ABI,
            functionName: "getOwners",
          },
          {
            address: safeAddress,
            abi: SAFE_ABI,
            functionName: "getModulesPaginated",
            args: ["0x0000000000000000000000000000000000000001", BigInt(10)],
          },
        ],
      }
    );

    if (
      balanceResult.status === "failure" ||
      decimalsResult.status === "failure" ||
      thresholdResult.status === "failure" ||
      signersResult.status === "failure" ||
      modulesResult.status === "failure"
    ) {
      throw new Error("One or more multicall requests failed");
    }

    const balance = parseFloat(formatDecimals(formatUnits(balanceResult.result, decimalsResult.result)));

    return {
      isDeployed: true,
      balance,
      threshold: Number(thresholdResult.result),
      signers: signersResult.result as Address[],
    };
  } catch (error) {
    console.error("Error fetching Safe data:", error);
    throw error;
  }
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
      setData((prev) => ({ ...prev, isLoading: true, error: null }));
      const safeData = await getSafeData(safeAddress);
      setData({
        ...safeData,
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

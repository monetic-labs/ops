import { Address, formatUnits } from "viem";
import { publicClient } from "@/config/web3";
import { safeAbi } from "@/utils/safe/abi";
import { BASE_USDC } from "@/utils/constants";
import { formatDecimals } from "@/utils/helpers";
import { isContractDeployed } from "@/utils/safe";

export interface SafeData {
  isDeployed: boolean;
  balance: number;
  threshold: number;
  signers: Address[];
}

export async function getSafeData(safeAddress: Address): Promise<SafeData> {
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

    if (
      balanceResult.status === "failure" ||
      decimalsResult.status === "failure" ||
      thresholdResult.status === "failure" ||
      signersResult.status === "failure"
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
    return {
      isDeployed: false,
      balance: 0,
      threshold: 0,
      signers: [],
    };
  }
}

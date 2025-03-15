import { Address, formatUnits } from "viem";
import { GasOption, fetchGasPrice } from "abstractionkit";

import { chainlinkAbi } from "@/utils/abi/chainlink";
import { publicClient, chain, PUBLIC_RPC } from "@/config/web3";

import { formatAmountUSD } from "@/utils/helpers";

// Chainlink ETH/USD Price Feed addresses
const CHAINLINK_ETH_USD_PRICE_FEED: Record<number, Address> = {
  84532: "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1", // Base Sepolia
  8453: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // Base Mainnet
};

/**
 * Gets the current ETH price in USD from Chainlink price feed
 * @returns The ETH price in USD
 */
export async function getEthPriceInUsd(): Promise<number> {
  try {
    const priceFeedAddress = CHAINLINK_ETH_USD_PRICE_FEED[chain.id];

    if (!priceFeedAddress) {
      console.warn(`No price feed address for chain ID ${chain.id}, using fallback price`);

      return 3000; // Fallback price if no price feed is available
    }

    const latestAnswerResult = await publicClient.readContract({
      address: priceFeedAddress,
      abi: chainlinkAbi,
      functionName: "latestAnswer",
    });

    // Chainlink ETH/USD price feed returns price with 8 decimals
    const ethPrice = Number(formatUnits(latestAnswerResult, 8));

    return ethPrice;
  } catch (error) {
    console.error("Error getting ETH price from Chainlink:", error);

    return 3000; // Fallback price if there's an error
  }
}

/**
 * Estimates the transfer fee for a given amount by creating a sample UserOperation
 * and estimating its gas costs, then converting to USD
 * @returns The estimated fee in ETH and USD
 */
export async function getEstimatedTransferFee() {
  // Get gas price from RPC
  const gasPrice = await fetchGasPrice(PUBLIC_RPC, GasOption.Fast);
  const maxFeePerGasInEth = formatUnits(gasPrice[0], 18);

  // Get current ETH price
  const ethPriceInUsd = await getEthPriceInUsd();

  // Calculate fee in USD using just maxFeePerGas (which includes priority fee)
  const feeInUsd = parseFloat(maxFeePerGasInEth) * ethPriceInUsd;

  // Display fee in USD correctly
  const formattedFeeInUsd = formatAmountUSD(feeInUsd);

  return {
    feeInEth: maxFeePerGasInEth,
    feeInUsd: formattedFeeInUsd,
  };
}

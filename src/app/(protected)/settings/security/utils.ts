import { base, baseSepolia } from "viem/chains";

/**
 * Returns an appropriate retry delay in milliseconds based on the chain's target block time.
 * @param chainId The ID of the current chain.
 * @returns Retry delay in milliseconds.
 */
export const getBlockTimeDelayMs = (chainId: number): number => {
  switch (chainId) {
    case base.id:
    case baseSepolia.id:
      return 2000; // Base L2 target block time ~2s

    // Add other chains here if needed in the future
    // e.g., case sepolia.id: return 13000; // Ethereum Sepolia L1 ~12-14s

    default:
      console.warn(`getBlockTimeDelayMs: Unknown chain ID ${chainId}, using default delay.`);
      return 3000; // Default fallback delay
  }
};

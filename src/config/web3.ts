import { http, createPublicClient, Chain } from "viem";
import { baseSepolia, base } from "viem/chains";

import { isLocal } from "@/utils/helpers";
import "viem/window";

// import { Magic } from "magic-sdk";

// // Magic
// export const magic = new Magic(MAGIC_PUBLISHABLE_API_KEY, {
//   network: {
//     rpcUrl: PUBLIC_RPC,
//     chainId: chain.id,
//   },
//   deferPreload: true,
// });

// Environment variables validation
const CANDIDE_API_KEY = process.env.NEXT_PUBLIC_CANDIDE_API_KEY;

if (!CANDIDE_API_KEY) {
  throw new Error("CANDIDE_API_KEY is not set");
}

const MAGIC_PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_API_KEY;

if (!MAGIC_PUBLISHABLE_API_KEY) {
  throw new Error("MAGIC_PUBLISHABLE_API_KEY is not set");
}

// Chain configuration
export const chain = isLocal ? baseSepolia : base;
export const PUBLIC_RPC = chain.rpcUrls.default.http[0];

// Chain name mapping
export const getChainName = (chain: Chain): string => {
  switch (chain.id) {
    case 84532:
      return "base-sepolia";
    case 8453:
      return "base";
    default:
      throw new Error(`Unsupported chain ID: ${chain.id}`);
  }
};

// Get sponsorship policy ID based on chain
const getSponsorshipPolicyId = (chain: Chain): string => {
  switch (chain.id) {
    case 84532: {
      const policyId = process.env.NEXT_PUBLIC_CANDIDE_BASE_SEPOLIA_SPONSORSHIP_POLICY_ID;

      if (!policyId) throw new Error("CANDIDE_BASE_SEPOLIA_SPONSORSHIP_POLICY_ID is not set");

      return policyId;
    }
    case 8453: {
      const policyId = process.env.CANDIDE_BASE_SPONSORSHIP_POLICY_ID;

      if (!policyId) throw new Error("CANDIDE_BASE_SPONSORSHIP_POLICY_ID is not set");

      return policyId;
    }
    default:
      throw new Error(`No sponsorship policy ID configured for chain ID: ${chain.id}`);
  }
};

// Public client configuration
export const publicClient = createPublicClient({
  chain,
  transport: http(),
});

// Candide API endpoints
const CANDIDE_BASE_URL = "https://api.candide.dev";
const chainName = getChainName(chain);

export const BUNDLER_URL = `${CANDIDE_BASE_URL}/bundler/v3/${chainName}/${CANDIDE_API_KEY}`;
export const PAYMASTER_URL = `${CANDIDE_BASE_URL}/paymaster/v3/${chainName}/${CANDIDE_API_KEY}`;
export const SPONSORSHIP_POLICY_ID = getSponsorshipPolicyId(chain);

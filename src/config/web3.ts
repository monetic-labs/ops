import { isProduction } from "@/utils/helpers";
import { http, createPublicClient } from "viem";
import { baseSepolia, base } from "viem/chains";
import "viem/window";

export const getChain = () => {
  return isProduction ? base : baseSepolia;
};

export const publicClient = createPublicClient({
  chain: getChain(),
  transport: http(),
});

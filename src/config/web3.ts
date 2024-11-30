import { isLocal } from "@/utils/helpers";
import { http, createPublicClient } from "viem";
import { baseSepolia, base } from "viem/chains";
import "viem/window";

export const getChain = () => {
  return isLocal ? baseSepolia : base;
};

export const publicClient = createPublicClient({
  chain: getChain(),
  transport: http(),
});

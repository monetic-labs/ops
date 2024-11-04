import { Address, erc20Abi } from "viem";
import { isLocal } from "./helpers";

export const MERCHANT_COOKIE_NAME = "pyv2_merchant_token";

export const OTP_CODE_LENGTH = 6;

export const BASE_USDC = {
  ADDRESS: isLocal
    ? ("0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address)
    : ("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address),
  DECIMALS: 6,
  SYMBOL: "USDC",
  ABI: erc20Abi,
};

export const MOCK_SETTLEMENT_ADDRESS = "0x595ec62736Bf19445d7F00D66072B3a3c7aeA0F5";
export const MOCK_BALANCE = "100";

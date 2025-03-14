import { Address, erc20Abi } from "viem";

import { isProduction } from "./helpers";

export const MERCHANT_COOKIE_NAME = "@backpack/services";

export const OTP_CODE_LENGTH = 6;

export const BASE_USDC = {
  ADDRESS: !isProduction
    ? ("0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address)
    : ("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address),
  DECIMALS: 6,
  SYMBOL: "USDC",
  ABI: erc20Abi,
};

export const MOCK_SETTLEMENT_ADDRESS = "0x595ec62736Bf19445d7F00D66072B3a3c7aeA0F5";
export const MOCK_BALANCE = "750";

export const BACKPACK_GUARDIAN_ADDRESS = "0x4198E85b2fDAc05993C8F5d70ab07Ab5348C0694";

import { erc20Abi } from "viem";
import { isLocal } from "./helpers";

export const MERCHANT_COOKIE_NAME = "pyv2_merchant_token";

export const OTP_CODE_LENGTH = 6;

export const BASE_USDC = {
  ADDRESS: isLocal ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  DECIMALS: 6,
  ABI: erc20Abi,
};

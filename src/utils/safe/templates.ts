import { Address, encodeFunctionData, erc20Abi, Hex, parseUnits } from "viem";
import {
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  MetaTransaction,
  SafeAccountV0_3_0 as SafeAccount,
  WebauthnPublicKey,
} from "abstractionkit";

import { PUBLIC_RPC } from "@/config/web3";

import { SAFE_ABI } from "../abi/safe";
import { RAIN_CONTROLLER_ABI } from "../abi/rain";

export const createApproveHashTemplate = (safeAddress: Address, opHash: Hex): MetaTransaction => {
  return {
    to: safeAddress,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: SAFE_ABI,
      functionName: "approveHash",
      args: [opHash],
    }),
  };
};

export const createRainWithdrawalTemplate = ({
  rainControllerAddress,
  rainCollateralProxyAddress,
  tokenAddress,
  tokenAmount,
  tokenDecimals,
  toAddress,
  expiresAtTimestamp,
  withdrawalSalt,
  withdrawalSignature,
}: {
  rainControllerAddress: Address;
  rainCollateralProxyAddress: Address;
  tokenAddress: Address;
  tokenAmount: string;
  tokenDecimals: number;
  toAddress: Address;
  expiresAtTimestamp: string;
  withdrawalSalt: Hex;
  withdrawalSignature: Hex;
}): MetaTransaction => {
  return {
    to: rainControllerAddress,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: RAIN_CONTROLLER_ABI,
      functionName: "withdrawAsset",
      args: [
        rainCollateralProxyAddress, // proxy address (Rain Card account)
        tokenAddress, // USDC token address
        parseUnits(tokenAmount, tokenDecimals),
        toAddress, // recipient address
        BigInt(expiresAtTimestamp),
        withdrawalSalt,
        withdrawalSignature,
      ],
    }),
  };
};

export const createERC20TransferTemplate = ({
  tokenAddress,
  toAddress,
  amount,
  decimals,
}: {
  tokenAddress: Address;
  toAddress: Address;
  amount: string;
  decimals: number;
}): MetaTransaction => {
  return {
    to: tokenAddress,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [toAddress, parseUnits(amount, decimals)],
    }),
  };
};

// Create transaction to add owner
export const createAddOwnerTemplate = async (
  safeAccount: SafeAccount,
  newOwner: WebauthnPublicKey | Address,
  newThreshold: number = 1
): Promise<MetaTransaction[]> => {
  return await safeAccount.createAddOwnerWithThresholdMetaTransactions(newOwner, newThreshold, {
    nodeRpcUrl: PUBLIC_RPC,
    eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  });
};

// Create transaction to remove owner
export const createRemoveOwnerTemplate = async (
  safeAccount: SafeAccount,
  prevOwner: Address,
  owner: WebauthnPublicKey | Address,
  newThreshold: number = 1
): Promise<MetaTransaction[]> => {
  const tx = await safeAccount.createRemoveOwnerMetaTransaction(PUBLIC_RPC, owner, newThreshold, {
    prevOwner,
    eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  });

  return [tx];
};

// Create transaction to swap owner
export const createSwapOwnerTemplate = async (
  safeAccount: SafeAccount,
  prevOwner: Address,
  oldOwner: WebauthnPublicKey | Address,
  newOwner: WebauthnPublicKey | Address
): Promise<MetaTransaction[]> => {
  return safeAccount.createSwapOwnerMetaTransactions(PUBLIC_RPC, newOwner, oldOwner, {
    prevOwner,
    eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  });
};

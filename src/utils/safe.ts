import {
  SafeAccountV0_3_0 as SafeAccount,
  WebauthnPublicKey,
  CandidePaymaster,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  type MetaTransaction,
  type UserOperationV7,
  type SignerSignaturePair,
  GasOption,
} from "abstractionkit";
import { Address, Hex } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";

import { BUNDLER_URL, chain, PAYMASTER_URL, PUBLIC_RPC, SPONSORSHIP_POLICY_ID } from "@/config/web3";

interface SafeAccountConfig {
  signer: WebauthnPublicKey | Address;
  isWebAuthn?: boolean;
}

// Core Safe Account Functions
export const createSafeAccount = ({ signer, isWebAuthn }: SafeAccountConfig) => {
  const account = SafeAccount.initializeNewAccount([signer], {
    ...(isWebAuthn && {
      eip7212WebAuthnPrecompileVerifierForSharedSigner: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
    }),
  });

  return account.accountAddress as Address;
};

// User Operation Functions
export const createUserOperation = async (
  walletAddress: Address,
  transactions: MetaTransaction[],
  config: {
    signer: WebauthnPublicKey | Address;
    isWebAuthn?: boolean;
    dummySignature?: SignerSignaturePair;
  }
) => {
  const account = new SafeAccount(walletAddress);

  const userOp = await account.createUserOperation(transactions, PUBLIC_RPC, BUNDLER_URL, {
    gasLevel: GasOption.Fast,
    ...(config.dummySignature
      ? { dummySignerSignaturePairs: [config.dummySignature] }
      : { expectedSigners: [config.signer] }),
    ...(config.isWebAuthn && {
      eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
    }),
  });

  return userOp;
};

export const sponsorUserOperation = async (userOp: UserOperationV7) => {
  const paymaster = new CandidePaymaster(PAYMASTER_URL);
  const [sponsoredOp] = await paymaster.createSponsorPaymasterUserOperation(userOp, BUNDLER_URL, SPONSORSHIP_POLICY_ID);

  Object.assign(userOp, sponsoredOp);

  return userOp;
};

export const sendUserOperation = async (
  walletAddress: Address,
  userOp: UserOperationV7,
  signature: SignerSignaturePair,
  isInit = false
) => {
  const account = new SafeAccount(walletAddress);

  // Format signature
  userOp.signature = SafeAccount.formatSignaturesToUseroperationSignature([signature], {
    isInit,
    eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  });

  // Send operation
  const response = await account.sendUserOperation(userOp, BUNDLER_URL);

  return response;
};

// Utility Functions
export const getUserOpHash = (userOp: UserOperationV7): Hex => {
  return SafeAccount.getUserOperationEip712Hash(userOp, BigInt(chain.id), {
    entrypointAddress: entryPoint07Address,
  }) as Hex;
};

export const createDeployTransaction = (safeAddress: Address): MetaTransaction => {
  const [factoryAddress, factoryData] = SafeAccount.createFactoryAddressAndData([safeAddress], { threshold: 1 });

  return {
    to: factoryAddress,
    data: factoryData,
    value: BigInt(0),
  };
};

// Helper function to create and send a user operation
export const createAndSendSponsoredUserOp = async (
  walletAddress: Address,
  transactions: MetaTransaction[],
  config: {
    signer: WebauthnPublicKey | Address;
    isWebAuthn?: boolean;
  }
) => {
  // Create user operation
  const userOp = await createUserOperation(walletAddress, transactions, config);

  // Add sponsorship
  const sponsoredOp = await sponsorUserOperation(userOp);

  // Get hash for signing
  const hash = getUserOpHash(sponsoredOp);

  return {
    userOp: sponsoredOp,
    hash,
  };
};

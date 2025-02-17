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

/**
 * Formats signatures for a user operation with proper WebAuthn configuration
 */
export const formatWebAuthnSignature = (
  signerSignaturePair: SignerSignaturePair,
  options: {
    isInit?: boolean;
    precompileAddress?: Address;
  } = {}
): string => {
  const { isInit = false, precompileAddress = DEFAULT_SECP256R1_PRECOMPILE_ADDRESS } = options;

  return SafeAccount.formatSignaturesToUseroperationSignature([signerSignaturePair], {
    isInit,
    eip7212WebAuthnPrecompileVerifier: precompileAddress,
  });
};

/**
 * Creates a user operation with proper signature formatting
 */
export const createSignedUserOperation = (
  account: SafeAccount,
  userOp: UserOperationV7,
  signature: SignerSignaturePair,
  options: {
    isInit?: boolean;
    precompileAddress?: Address;
  } = {}
): UserOperationV7 => {
  userOp.signature = formatWebAuthnSignature(signature, options);

  return userOp;
};

/**
 * Creates a settlement operation with an approved signature
 */
export const createSettlementOperationWithApproval = (
  individualAccountAddress: Address,
  settlementAccountUserOperation: UserOperationV7,
  precompileAddress: Address = DEFAULT_SECP256R1_PRECOMPILE_ADDRESS
): UserOperationV7 => {
  const approvedSignature = ("0x000000000000000000000000" +
    individualAccountAddress.slice(2) +
    "000000000000000000000000000000000000000000000000000000000000000001") as Hex;

  return createSignedUserOperation(
    new SafeAccount(individualAccountAddress),
    settlementAccountUserOperation,
    { signer: individualAccountAddress, signature: approvedSignature },
    { precompileAddress }
  );
};

// Clean up the sendUserOperation function to use the new utilities
export const sendUserOperation = async (
  walletAddress: Address,
  userOp: UserOperationV7,
  signature: SignerSignaturePair,
  isInit = false
) => {
  const account = new SafeAccount(walletAddress);
  const signedOp = await createSignedUserOperation(account, userOp, signature, { isInit });

  return account.sendUserOperation(signedOp, BUNDLER_URL);
};

// Improve error handling in tracking functions
export const trackUserOperationResponse = async (
  response: UserOperationResponse,
  callbacks: OperationTrackingCallbacks = {}
): Promise<void> => {
  const { onSent, onError, onSuccess } = callbacks;

  try {
    onSent?.();
    const receipt = await response.included();

    if (!receipt.success) {
      throw new Error("Operation execution failed");
    }

    onSuccess?.();
  } catch (error) {
    const formattedError = error instanceof Error ? error : new Error("Unknown error occurred");

    onError?.(formattedError);
    throw formattedError;
  }
};

/**
 * Sends a user operation and tracks its status with improved error handling
 */
export const sendAndTrackUserOperation = async (
  account: SafeAccount,
  userOp: UserOperationV7,
  callbacks: OperationTrackingCallbacks = {}
): Promise<void> => {
  try {
    const response = await account.sendUserOperation(userOp, BUNDLER_URL);

    await trackUserOperationResponse(response, callbacks);
  } catch (error) {
    const formattedError = error instanceof Error ? error : new Error("Failed to send or track operation");

    callbacks.onError?.(formattedError);
    throw formattedError;
  }
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

// Add new types and utilities for settlement operations
export type UserOperationResponse = {
  included: () => Promise<{ success: boolean }>;
};

export type OperationTrackingCallbacks = {
  onSent?: () => void;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
};

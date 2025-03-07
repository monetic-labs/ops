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

import { BUNDLER_URL, chain, PAYMASTER_URL, PUBLIC_RPC, SPONSORSHIP_POLICY_ID, publicClient } from "@/config/web3";

interface SafeAccountConfig {
  signers: (WebauthnPublicKey | Address)[];
  isWebAuthn?: boolean;
  threshold?: number;
}

// Core Safe Account Functions
export const createSafeAccount = ({ signers, isWebAuthn, threshold = 1 }: SafeAccountConfig) => {
  const account = SafeAccount.initializeNewAccount(signers, {
    threshold,
    ...(isWebAuthn && {
      eip7212WebAuthnPrecompileVerifierForSharedSigner: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
    }),
  });

  return {
    address: account.accountAddress as Address,
    instance: account,
  };
};

// Create transaction to swap owner
export const createSwapOwnerTransaction = async (
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

// Create transaction to remove owner
export const createRemoveOwnerTransaction = async (
  safeAccount: SafeAccount,
  prevOwner: Address,
  owner: WebauthnPublicKey | Address,
  newThreshold: number
): Promise<MetaTransaction[]> => {
  const tx = await safeAccount.createRemoveOwnerMetaTransaction(PUBLIC_RPC, owner, newThreshold, {
    prevOwner,
    eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  });

  return [tx];
};

// Create transaction to add owner
export const createAddOwnerTransaction = async (
  safeAccount: SafeAccount,
  owner: WebauthnPublicKey | Address,
  newThreshold: number
): Promise<MetaTransaction[]> => {
  return await safeAccount.createAddOwnerWithThresholdMetaTransactions(owner, newThreshold, {
    nodeRpcUrl: PUBLIC_RPC,
    eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  });
};

// Create deployment transactions for a sub-account
export const createSubAccountDeploymentTransactions = async (
  safeAccount: SafeAccount,
  deployerAddress: Address,
  selectedSigners: Address[],
  threshold: number
): Promise<MetaTransaction[]> => {
  // Start with deployment transaction
  const deployTx = createDeployTransaction(safeAccount.accountAddress as Address);
  const transactions: MetaTransaction[] = [deployTx];

  // Determine if deployer should be a final signer
  const isDeployerFinalSigner = selectedSigners.includes(deployerAddress);
  const finalSigners = isDeployerFinalSigner ? selectedSigners : selectedSigners.filter((s) => s !== deployerAddress);

  // Add all signers except deployer (who is already the initial signer)
  if (finalSigners.length > 0) {
    const addOwnerTxs = await Promise.all(
      finalSigners
        .filter((signer) => signer !== deployerAddress)
        .map((signer) => createAddOwnerTransaction(safeAccount, signer, 1))
    );

    transactions.push(...addOwnerTxs.flat());
  }

  // Final configuration: either remove deployer or update threshold
  if (!isDeployerFinalSigner && finalSigners.length > 0) {
    // Remove deployer and set final threshold
    const lastSigner = finalSigners[finalSigners.length - 1];
    const removeOwnerTxs = await createRemoveOwnerTransaction(safeAccount, lastSigner, deployerAddress, threshold);

    transactions.push(...removeOwnerTxs);
  } else if (threshold > 1) {
    // Update threshold using the last signer
    const lastSigner = finalSigners[finalSigners.length - 1];
    const updateThresholdTxs = await createAddOwnerTransaction(safeAccount, lastSigner, threshold);

    transactions.push(...updateThresholdTxs);
  }

  return transactions;
};

// User Operation Functions
export const createUserOperation = async (
  walletAddress: Address,
  transactions: MetaTransaction[],
  config: {
    signer: WebauthnPublicKey | Address;
    isWebAuthn?: boolean;
    dummySignature?: SignerSignaturePair;
    safeAccount?: SafeAccount;
  }
) => {
  const isDeployed = await isContractDeployed(walletAddress);

  // If not deployed, use provided safeAccount or create a new one
  const account =
    config.safeAccount ||
    (isDeployed
      ? new SafeAccount(walletAddress)
      : SafeAccount.initializeNewAccount([config.signer], {
          threshold: 1,
          ...(config.isWebAuthn && {
            eip7212WebAuthnPrecompileVerifierForSharedSigner: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
          }),
        }));

  // Verify the calculated address matches
  if (!isDeployed && account.accountAddress !== walletAddress) {
    throw new Error("Calculated account address does not match expected address");
  }

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
  userOp: UserOperationV7,
  signature: SignerSignaturePair,
  options: {
    precompileAddress?: Address;
  } = {}
): UserOperationV7 => {
  userOp.signature = formatWebAuthnSignature(signature, { ...options, isInit: userOp.nonce === BigInt(0) });

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
    settlementAccountUserOperation,
    { signer: individualAccountAddress, signature: approvedSignature },
    { precompileAddress }
  );
};

// Clean up the sendUserOperation function to use the new utilities
export const sendUserOperation = (walletAddress: Address, userOp: UserOperationV7, signature: SignerSignaturePair) => {
  const account = new SafeAccount(walletAddress);
  const signedOp = createSignedUserOperation(userOp, signature);

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
    safeAccount?: SafeAccount;
  }
) => {
  // Create user operation
  const userOp = await createUserOperation(walletAddress, transactions, {
    signer: config.signer,
    isWebAuthn: config.isWebAuthn,
    safeAccount: config.safeAccount,
  });

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

/**
 * Checks if a contract is deployed at the given address
 * @param address The address to check
 * @returns A promise that resolves to true if a contract is deployed at the address
 */
export const isContractDeployed = async (address: Address): Promise<boolean> => {
  try {
    const code = await publicClient.getCode({ address });

    return Boolean(code && code.length > 2);
  } catch (error) {
    console.error("Error checking contract deployment:", error);

    return false;
  }
};

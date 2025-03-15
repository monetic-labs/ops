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
import { isContractDeployed } from "./account";

/**
 * Response type for user operations
 */
export type UserOperationResponse = {
  included: () => Promise<{ success: boolean }>;
};

/**
 * Callbacks for tracking operation status
 */
export type OperationTrackingCallbacks = {
  onSent?: () => void;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
};

/**
 * Creates a deploy transaction for a Safe account
 *
 * @param signers Array of signer addresses
 * @param threshold Threshold for the account
 * @returns A meta transaction to deploy the account
 */
export const createDeployTransaction = (signers: Address[], threshold: number = 1): MetaTransaction => {
  const [factoryAddress, factoryData] = SafeAccount.createFactoryAddressAndData(signers, { threshold });

  return {
    to: factoryAddress,
    data: factoryData,
    value: BigInt(0),
  };
};

/**
 * Creates a user operation for the given transactions
 *
 * @param walletAddress The Safe account address
 * @param transactions Array of transactions to include in the operation
 * @param config Configuration for the operation
 * @returns The created user operation
 */
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

/**
 * Sponsors a user operation with the Candide paymaster
 *
 * @param userOp The user operation to sponsor
 * @returns The sponsored user operation
 */
export const sponsorUserOperation = async (userOp: UserOperationV7) => {
  const paymaster = new CandidePaymaster(PAYMASTER_URL);
  const [sponsoredOp] = await paymaster.createSponsorPaymasterUserOperation(userOp, BUNDLER_URL, SPONSORSHIP_POLICY_ID);

  Object.assign(userOp, sponsoredOp);

  return userOp;
};

/**
 * Gets the hash of a user operation for signing
 *
 * @param userOp The user operation
 * @returns The operation hash
 */
export const getUserOpHash = (userOp: UserOperationV7): Hex => {
  return SafeAccount.getUserOperationEip712Hash(userOp, BigInt(chain.id), {
    entrypointAddress: entryPoint07Address,
  }) as Hex;
};

/**
 * Creates and sponsors a user operation
 *
 * @param walletAddress The Safe account address
 * @param transactions Array of transactions to include
 * @param config Configuration for the operation
 * @returns The user operation and hash
 */
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

/**
 * Formats signatures for a user operation with WebAuthn configuration
 *
 * @param signerSignaturePair The signer and signature
 * @param options Options for formatting
 * @returns The formatted signature string
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
 * Creates a signed user operation
 *
 * @param userOp The user operation
 * @param signature The signature pair
 * @param options Options for signature formatting
 * @returns The signed user operation
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
 *
 * @param individualAccountAddress The individual account address
 * @param settlementAccountUserOperation The settlement account operation
 * @param precompileAddress The WebAuthn precompile address
 * @returns The signed operation
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

/**
 * Sends a user operation
 *
 * @param walletAddress The wallet address
 * @param userOp The user operation
 * @param signature The signature
 * @returns The operation response
 */
export const sendUserOperation = (walletAddress: Address, userOp: UserOperationV7, signature: SignerSignaturePair) => {
  const account = new SafeAccount(walletAddress);
  const signedOp = createSignedUserOperation(userOp, signature);

  return account.sendUserOperation(signedOp, BUNDLER_URL);
};

/**
 * Tracks the status of a user operation
 *
 * @param response The operation response
 * @param callbacks Callbacks for tracking
 */
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
 * Sends a user operation and tracks its status
 *
 * @param account The Safe account
 * @param userOp The user operation
 * @param callbacks Callbacks for tracking
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

import {
  SafeAccountV0_3_0 as SafeAccount,
  WebauthnPublicKey,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  MetaTransaction,
} from "abstractionkit";
import { Address, PublicClient, defineChain, getContract, hexToBigInt, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { SAFE_ABI } from "@/utils/abi/safe"; // Use alias path
import { publicClient as configuredClient } from "@/config/web3"; // Import with alias

import { createAddOwnerTemplate, createRemoveOwnerTemplate } from "../templates";

import { createDeployTransaction } from "./operations";

/**
 * Configuration for creating a Safe account
 */
export interface SafeAccountConfig {
  signers: (WebauthnPublicKey | Address)[];
  isWebAuthn?: boolean;
  threshold?: number;
}

/**
 * Creates a new Safe account with the given signers and threshold
 *
 * @param config Configuration for the Safe account
 * @returns The account address and instance
 */
export const createSafeAccount = ({ signers, isWebAuthn = false, threshold = 1 }: SafeAccountConfig) => {
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

/**
 * Checks if a contract is deployed at a given address.
 * @param address The contract address.
 * @param client Optional public client instance.
 * @returns True if bytecode exists, false otherwise.
 */
export const isContractDeployed = async (
  address: Address,
  // Use the imported client, cast to viem's PublicClient type
  client: PublicClient = configuredClient as PublicClient
): Promise<boolean> => {
  try {
    const bytecode = await client.getBytecode({ address });
    return !!bytecode && bytecode !== "0x";
  } catch (error) {
    console.error(`Error checking deployment status for ${address}:`, error);
    return false;
  }
};

/**
 * Gets the current threshold of a Safe account.
 * @param safeAddress The address of the Safe.
 * @param client Optional public client instance.
 * @returns The current threshold number.
 * @throws If the address is not a contract or fetching fails.
 */
export const getSafeThreshold = async (
  safeAddress: Address,
  // Use the imported client, cast to viem's PublicClient type
  client: PublicClient = configuredClient as PublicClient
): Promise<number> => {
  try {
    const threshold = await client.readContract({
      address: safeAddress,
      abi: SAFE_ABI,
      functionName: "getThreshold",
    });
    // Ensure the returned value is a bigint before converting
    if (typeof threshold !== "bigint") {
      throw new Error(`Invalid threshold value received: ${threshold}`);
    }
    return Number(threshold);
  } catch (error) {
    console.error(`Error fetching threshold for Safe ${safeAddress}:`, error);
    // Re-throw a more specific error or handle as needed
    throw new Error(`Failed to get threshold for ${safeAddress}: ${error instanceof Error ? error.message : error}`);
  }
};

/**
 * Creates a sequence of transactions for deploying a sub-account with specified signers and threshold
 *
 * @param safeAccount The Safe account instance to use for deployment
 * @param deployerAddress The address that will deploy the sub-account
 * @param selectedSigners The final list of signers for the sub-account
 * @param threshold The minimum number of signatures required
 * @returns Array of transactions to execute
 */
export const createSubAccountDeploymentTransactions = async (
  safeAccount: SafeAccount,
  deployerAddress: Address,
  selectedSigners: Address[],
  threshold: number
): Promise<MetaTransaction[]> => {
  // Start with deployment transaction
  const deployTx = createDeployTransaction([safeAccount.accountAddress as Address]);
  const transactions: MetaTransaction[] = [deployTx];

  // Determine if deployer should be a final signer
  const isDeployerFinalSigner = selectedSigners.includes(deployerAddress);
  const finalSigners = isDeployerFinalSigner ? selectedSigners : selectedSigners.filter((s) => s !== deployerAddress);

  // Add all signers except deployer (who is already the initial signer)
  if (finalSigners.length > 0) {
    const addOwnerTxs = await Promise.all(
      finalSigners
        .filter((signer) => signer !== deployerAddress)
        .map((signer) => createAddOwnerTemplate(safeAccount, signer, 1))
    );

    transactions.push(...addOwnerTxs.flat());
  }

  // Final configuration: either remove deployer or update threshold
  if (!isDeployerFinalSigner && finalSigners.length > 0) {
    // Remove deployer and set final threshold
    const lastSigner = finalSigners[finalSigners.length - 1];
    const removeOwnerTxs = await createRemoveOwnerTemplate(safeAccount, lastSigner, deployerAddress, threshold);

    transactions.push(...removeOwnerTxs);
  } else if (threshold > 1) {
    // Update threshold using the last signer
    const lastSigner = finalSigners[finalSigners.length - 1];
    const updateThresholdTxs = await createAddOwnerTemplate(safeAccount, lastSigner, threshold);

    transactions.push(...updateThresholdTxs);
  }

  return transactions;
};

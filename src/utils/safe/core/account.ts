import {
  SafeAccountV0_3_0 as SafeAccount,
  WebauthnPublicKey,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  MetaTransaction,
} from "abstractionkit";
import { Address } from "viem";
import { publicClient } from "@/config/web3";

import { createDeployTransaction } from "./operations";
import { createAddOwnerTemplate, createRemoveOwnerTemplate } from "../templates";

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
 * Checks if a contract is deployed at the given address
 *
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

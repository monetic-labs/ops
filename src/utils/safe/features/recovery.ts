import { Address } from "viem";
import { SocialRecoveryModule, SocialRecoveryModuleGracePeriodSelector, MetaTransaction } from "abstractionkit";
import {
  RecoveryWalletMethod,
  RecoveryWalletGenerateInput,
  RecoveryWalletGenerateOutput,
} from "@backpack-fux/pylon-sdk";

import { PUBLIC_RPC } from "@/config/web3";
import { isLocal, isProduction } from "@/utils/helpers";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";
import pylon from "@/libs/pylon-sdk";
import { executeDirectTransaction, DirectTransactionCallbacks } from "../flows/direct";
import { WebAuthnCredentials } from "@/types/webauthn";

// Types for recovery methods
export interface RecoveryMethods {
  email: string;
  phone: string;
}

// Default module instance with appropriate grace period based on environment
export const defaultSocialRecoveryModule = new SocialRecoveryModule(
  !isProduction
    ? SocialRecoveryModuleGracePeriodSelector.After3Minutes
    : SocialRecoveryModuleGracePeriodSelector.After7Days
);

/**
 * Generates recovery wallet addresses for the provided methods
 *
 * @param methods Recovery methods (email, phone)
 * @returns Array of guardian addresses including Backpack and recovery wallets
 */
export async function generateRecoveryAddresses(methods: RecoveryMethods): Promise<Address[]> {
  const recoveryInputs: RecoveryWalletGenerateInput[] = [
    { identifier: methods.email, method: RecoveryWalletMethod.EMAIL },
    { identifier: methods.phone, method: RecoveryWalletMethod.PHONE },
  ];

  const recoveryWallets = await pylon.generateRecoveryWallets(recoveryInputs);

  // Return all guardian addresses including Backpack
  return [
    BACKPACK_GUARDIAN_ADDRESS as Address,
    ...recoveryWallets.map((wallet: RecoveryWalletGenerateOutput) => wallet.publicAddress as Address),
  ];
}

/**
 * Creates recovery module transactions
 *
 * @param accountAddress The account address to set up recovery for
 * @param guardianAddresses List of guardian addresses
 * @returns Array of transactions to enable module and add guardians
 */
export function createRecoveryTransactions(accountAddress: Address, guardianAddresses: Address[]) {
  const enableModuleTx = createEnableModuleTransaction(accountAddress);
  const addGuardianTxs = guardianAddresses.map((address, index) =>
    createAddGuardianTransaction(address, index === 0 ? 1 : 2)
  );

  return [enableModuleTx, ...addGuardianTxs];
}

/**
 * Checks if Backpack is configured as a guardian for the given account
 *
 * @param accountAddress The account to check
 * @param module Optional SocialRecoveryModule instance
 * @returns Promise resolving to true if Backpack is a guardian
 */
export async function isBackpackGuardian(
  accountAddress: Address,
  module: SocialRecoveryModule = defaultSocialRecoveryModule
): Promise<boolean> {
  if (isLocal) return true;

  return module.isGuardian(PUBLIC_RPC, accountAddress, BACKPACK_GUARDIAN_ADDRESS);
}

/**
 * Creates a transaction to enable the social recovery module
 *
 * @param accountAddress The account address
 * @param module Optional SocialRecoveryModule instance
 * @returns MetaTransaction to enable the module
 */
export function createEnableModuleTransaction(
  accountAddress: Address,
  module: SocialRecoveryModule = defaultSocialRecoveryModule
): MetaTransaction {
  return module.createEnableModuleMetaTransaction(accountAddress);
}

/**
 * Creates a transaction to add a guardian with threshold
 *
 * @param guardianAddress The guardian to add
 * @param threshold The new threshold
 * @param module Optional SocialRecoveryModule instance
 * @returns MetaTransaction to add guardian
 */
export function createAddGuardianTransaction(
  guardianAddress: Address,
  threshold: number,
  module: SocialRecoveryModule = defaultSocialRecoveryModule
): MetaTransaction {
  return module.createAddGuardianWithThresholdMetaTransaction(guardianAddress, BigInt(threshold));
}

/**
 * Creates a transaction to revoke a guardian while maintaining a safe threshold
 *
 * @param accountAddress The account address
 * @param guardianAddress The guardian to revoke
 * @param currentThreshold Current threshold for guardians
 * @param module Optional SocialRecoveryModule instance
 * @returns MetaTransaction to revoke guardian
 */
export async function createRevokeGuardianTransaction(
  accountAddress: Address,
  guardianAddress: Address,
  currentThreshold: number,
  module: SocialRecoveryModule = defaultSocialRecoveryModule
): Promise<MetaTransaction> {
  // Get current guardians to calculate new threshold
  const currentGuardians = await module.getGuardians(PUBLIC_RPC, accountAddress);
  const newGuardiansCount = currentGuardians.length - 1;

  // If we'll have 2 or fewer guardians left, require all of them
  const newThreshold = newGuardiansCount <= 2 ? BigInt(newGuardiansCount) : BigInt(currentThreshold);

  return module.createRevokeGuardianWithThresholdMetaTransaction(
    PUBLIC_RPC,
    accountAddress,
    guardianAddress,
    newThreshold
  );
}

// Interface for setup social recovery callbacks
interface SetupRecoveryCallbacks extends DirectTransactionCallbacks {
  onRecoverySetup?: () => void;
}

// Configuration for setting up social recovery
interface SetupRecoveryConfig {
  walletAddress: Address;
  credentials: WebAuthnCredentials;
  recoveryMethods: RecoveryMethods;
  callbacks?: SetupRecoveryCallbacks;
}

/**
 * Sets up social recovery for an existing Safe account
 *
 * @param config Configuration for recovery setup
 * @returns Promise resolving to guardian addresses
 */
export async function setupSocialRecovery({
  walletAddress,
  credentials,
  recoveryMethods,
  callbacks,
}: SetupRecoveryConfig): Promise<Address[]> {
  try {
    // Generate recovery wallet addresses
    const guardianAddresses = await generateRecoveryAddresses(recoveryMethods);

    // Create recovery transactions
    const recoveryTxs = createRecoveryTransactions(walletAddress, guardianAddresses);

    // Execute the transactions
    await executeDirectTransaction({
      safeAddress: walletAddress,
      transactions: recoveryTxs,
      credentials,
      callbacks: {
        ...callbacks,
        onSuccess: () => {
          callbacks?.onRecoverySetup?.();
          callbacks?.onSuccess?.();
        },
      },
    });

    return guardianAddresses;
  } catch (error) {
    console.error("Error setting up social recovery:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
}

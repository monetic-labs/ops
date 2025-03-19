import { Address } from "viem";
import { SocialRecoveryModule, SocialRecoveryModuleGracePeriodSelector, MetaTransaction } from "abstractionkit";
import {
  RecoveryWalletMethod,
  RecoveryWalletGenerateInput,
  RecoveryWalletGenerateOutput,
} from "@backpack-fux/pylon-sdk";

import { PUBLIC_RPC, publicClient } from "@/config/web3";
import { isLocal, isProduction } from "@/utils/helpers";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";
import pylon from "@/libs/pylon-sdk";
import { WebAuthnCredentials } from "@/types/webauthn";
import { SAFE_ABI } from "@/utils/abi/safe";

import { executeDirectTransaction, DirectTransactionCallbacks } from "../flows/direct";

const THREE_MINUTE_BASE_SEPOLIA = "0xBB5fa1b6604EaBc4B019c3769cd9D0D82b54140e";

// Types for recovery methods
export interface RecoveryMethods {
  email: string;
  phone: string;
}

// Default module instance with appropriate grace period based on environment
export const defaultSocialRecoveryModule = new SocialRecoveryModule(
  !isProduction
    ? THREE_MINUTE_BASE_SEPOLIA // Custom module address for dev/testing
    : SocialRecoveryModuleGracePeriodSelector.After7Days
);

/**
 * Creates a social recovery module with a specific grace period
 *
 * @enum gracePeriod The grace period selection
 * @returns A SocialRecoveryModule instance with the selected grace period
 */
export function createSocialRecoveryModule(
  gracePeriodSelector: SocialRecoveryModuleGracePeriodSelector
): SocialRecoveryModule {
  // Allow testing period for development environments
  if (!isProduction) {
    return new SocialRecoveryModule(THREE_MINUTE_BASE_SEPOLIA);
  }

  // Map user-friendly values to SDK constants
  switch (gracePeriodSelector) {
    case SocialRecoveryModuleGracePeriodSelector.After14Days:
      return new SocialRecoveryModule(SocialRecoveryModuleGracePeriodSelector.After14Days);
    case SocialRecoveryModuleGracePeriodSelector.After7Days:
      return new SocialRecoveryModule(SocialRecoveryModuleGracePeriodSelector.After7Days);
    case SocialRecoveryModuleGracePeriodSelector.After3Days:
      return new SocialRecoveryModule(SocialRecoveryModuleGracePeriodSelector.After3Days);
    default:
      return new SocialRecoveryModule(SocialRecoveryModuleGracePeriodSelector.After7Days);
  }
}

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

  const backpackAddressLower = BACKPACK_GUARDIAN_ADDRESS.toLowerCase();

  try {
    // Get all guardians and check manually for more robustness
    const guardians = await module.getGuardians(PUBLIC_RPC, accountAddress);

    // Manual case-insensitive comparison for maximum reliability
    let isGuardian = false;
    for (const guardianAddress of guardians) {
      if (guardianAddress.toLowerCase() === backpackAddressLower) {
        isGuardian = true;
        break;
      }
    }

    return isGuardian;
  } catch (error) {
    console.error("Error checking if Backpack is a guardian:", error);
    return false;
  }
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

/**
 * Checks if the social recovery module is enabled for the given account
 *
 * @param accountAddress The account to check
 * @param module Optional SocialRecoveryModule instance
 * @returns Promise resolving to true if the module is enabled
 */
export async function isModuleEnabled(
  accountAddress: Address,
  module: SocialRecoveryModule = defaultSocialRecoveryModule
): Promise<boolean> {
  const moduleAddress = module.moduleAddress as Address;

  console.log("Checking if module is enabled:", {
    accountAddress,
    moduleAddress,
    customModuleAddress: THREE_MINUTE_BASE_SEPOLIA,
    isDevEnvironment: !isProduction,
  });

  try {
    const isEnabled = await publicClient.readContract({
      address: accountAddress,
      abi: SAFE_ABI,
      functionName: "isModuleEnabled",
      args: [moduleAddress],
    });

    console.log("Module enabled status:", isEnabled);
    return isEnabled;
  } catch (error) {
    console.error("Error checking if module is enabled:", error);
    return false;
  }
}

/**
 * Toggles Backpack as a guardian for account recovery (enables or disables)
 *
 * @param accountAddress The account address
 * @param credentials WebAuthn credentials for signing
 * @param enable Whether to enable (true) or disable (false) Backpack as a guardian
 * @param threshold Threshold for guardian consensus (default: 2)
 * @param callbacks Optional callbacks for transaction tracking
 * @returns Promise resolving to success indicator
 */
export async function toggleBackpackRecovery({
  accountAddress,
  credentials,
  enable = true,
  threshold = 2,
  callbacks,
}: {
  accountAddress: Address;
  credentials: WebAuthnCredentials;
  enable?: boolean;
  threshold?: number;
  callbacks?: DirectTransactionCallbacks;
}): Promise<{ success: boolean }> {
  try {
    // Check current guardian status with our improved robust check
    const isGuardian = await isBackpackGuardian(accountAddress);
    const moduleEnabled = await isModuleEnabled(accountAddress);

    // If already in desired state, return success
    if ((enable && isGuardian) || (!enable && !isGuardian)) {
      console.log(`Backpack is already ${enable ? "enabled" : "disabled"} as a guardian`);
      return { success: true };
    }

    // Create necessary transactions
    const transactions: MetaTransaction[] = [];

    if (enable) {
      // Only check if module is enabled when enabling
      // Only add the enable module transaction if the module is not already enabled
      if (!moduleEnabled) {
        const enableModuleTx = createEnableModuleTransaction(accountAddress);
        transactions.push(enableModuleTx);
      }

      // Add the add guardian transaction
      const addGuardianTx = createAddGuardianTransaction(BACKPACK_GUARDIAN_ADDRESS, threshold);
      transactions.push(addGuardianTx);
    } else {
      // Create transaction to revoke Backpack as guardian
      const revokeGuardianTx = await createRevokeGuardianTransaction(
        accountAddress,
        BACKPACK_GUARDIAN_ADDRESS,
        threshold
      );
      transactions.push(revokeGuardianTx);
    }

    // Execute the transactions
    return await executeDirectTransaction({
      safeAddress: accountAddress,
      transactions,
      credentials,
      callbacks,
    });
  } catch (error) {
    console.error("Error toggling Backpack recovery:", error);
    return { success: false };
  }
}

/**
 * Adds a recovery method (email or phone) as a guardian
 *
 * @param accountAddress The account address
 * @param credentials WebAuthn credentials for signing
 * @param identifier Email or phone to use as recovery
 * @param method Type of recovery method (email or phone)
 * @param threshold Threshold for guardian consensus (default: 2)
 * @param callbacks Optional callbacks for transaction tracking
 * @returns Promise resolving to recovery wallet ID
 */
export async function addRecoveryMethod({
  accountAddress,
  credentials,
  identifier,
  method,
  threshold = 2,
  callbacks,
}: {
  accountAddress: Address;
  credentials: WebAuthnCredentials;
  identifier: string;
  method: RecoveryWalletMethod;
  threshold?: number;
  callbacks?: DirectTransactionCallbacks;
}): Promise<string> {
  try {
    // Generate recovery wallet
    const newWallets = await pylon.generateRecoveryWallets([{ identifier, method }]);

    if (!newWallets || newWallets.length === 0) {
      throw new Error("Failed to generate recovery wallet");
    }

    // Create guardian transaction
    const addGuardianTx = createAddGuardianTransaction(newWallets[0].publicAddress as Address, threshold);

    // Execute the transaction
    const result = await executeDirectTransaction({
      safeAddress: accountAddress,
      transactions: [addGuardianTx],
      credentials,
      callbacks,
    });

    if (result.success) {
      return newWallets[0].id;
    } else {
      throw new Error("Failed to add recovery method");
    }
  } catch (error) {
    console.error(`Error adding ${method} recovery:`, error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
}

/**
 * Removes a recovery method (email or phone) guardian from the account
 *
 * @param accountAddress The account address
 * @param credentials WebAuthn credentials for signing
 * @param guardianAddress The guardian address to remove
 * @param threshold Current threshold for guardian consensus (default: 2)
 * @param callbacks Optional callbacks for transaction tracking
 * @returns Promise resolving to success indicator
 */
export async function removeRecoveryMethod({
  accountAddress,
  credentials,
  guardianAddress,
  threshold = 2,
  callbacks,
}: {
  accountAddress: Address;
  credentials: WebAuthnCredentials;
  guardianAddress: Address;
  threshold?: number;
  callbacks?: DirectTransactionCallbacks;
}): Promise<{ success: boolean }> {
  try {
    // Check if the address is actually a guardian
    const isGuardian = await defaultSocialRecoveryModule.isGuardian(PUBLIC_RPC, accountAddress, guardianAddress);

    if (!isGuardian) {
      console.log("Address is not configured as a guardian");

      return { success: true };
    }

    // Create transaction to revoke guardian
    const revokeGuardianTx = await createRevokeGuardianTransaction(accountAddress, guardianAddress, threshold);

    // Execute the transaction
    return await executeDirectTransaction({
      safeAddress: accountAddress,
      transactions: [revokeGuardianTx],
      credentials,
      callbacks,
    });
  } catch (error) {
    console.error("Error removing recovery method:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
}

/**
 * Gets the current guardian threshold for an account
 *
 * @param accountAddress The account address
 * @param module Optional SocialRecoveryModule instance
 * @returns Promise resolving to the current threshold, or 0 if module not enabled
 */
export async function getGuardianThreshold(
  accountAddress: Address,
  module: SocialRecoveryModule = defaultSocialRecoveryModule
): Promise<number> {
  try {
    console.log("Getting guardian threshold for:", {
      accountAddress,
      moduleAddress: module.moduleAddress,
      rpc: PUBLIC_RPC,
    });

    // First check if the module is enabled
    const isEnabled = await isModuleEnabled(accountAddress, module);

    if (!isEnabled) {
      console.log("Social recovery module is not enabled for account:", accountAddress);
      return 0;
    }

    try {
      console.log("Calling module.threshold with:", {
        rpc: PUBLIC_RPC,
        accountAddress,
        moduleAddress: module.moduleAddress,
      });

      const threshold = await module.threshold(PUBLIC_RPC, accountAddress);
      console.log("Retrieved guardian threshold:", Number(threshold));
      return Number(threshold);
    } catch (thresholdError) {
      console.error("Error in module.threshold call:", thresholdError);

      // Check if this is the buffer overflow error
      if (
        thresholdError instanceof RangeError &&
        thresholdError.message.includes("data out-of-bounds") &&
        thresholdError.message.includes("buffer=0x, length=0")
      ) {
        console.warn("Buffer out-of-bounds error caught - likely the module is not properly initialized yet");
        // Return 0 as the module might not be properly initialized
        return 0;
      }

      // Re-throw other errors
      throw thresholdError;
    }
  } catch (error) {
    console.error("Error getting guardian threshold:", error);
    return 0;
  }
}

import { SocialRecoveryModule, SocialRecoveryModuleGracePeriodSelector, MetaTransaction } from "abstractionkit";
import { Address } from "viem";

import { PUBLIC_RPC } from "@/config/web3";
import { isLocal, isProduction } from "@/utils/helpers";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";

// Default module instance with 7-day grace period
export const defaultSocialRecoveryModule = new SocialRecoveryModule(
  !isProduction
    ? SocialRecoveryModuleGracePeriodSelector.After3Minutes
    : SocialRecoveryModuleGracePeriodSelector.After7Days
);

/**
 * Checks if Backpack is configured as a guardian for the given account.
 * Returns true in local development for testing purposes.
 * @param accountAddress The account to check
 * @param module Optional SocialRecoveryModule instance (uses default if not provided)
 */
export async function isBackpackGuardian(
  accountAddress: Address,
  module: SocialRecoveryModule = defaultSocialRecoveryModule
): Promise<boolean> {
  if (isLocal) return true;

  return module.isGuardian(PUBLIC_RPC, accountAddress, BACKPACK_GUARDIAN_ADDRESS);
}

/**
 * Creates a transaction to revoke a guardian while maintaining a safe threshold.
 * Automatically adjusts the threshold if there would be too few guardians remaining.
 * @param accountAddress The account address
 * @param guardianAddress The guardian to revoke
 * @param currentThreshold Current threshold for guardians
 * @param module Optional SocialRecoveryModule instance (uses default if not provided)
 */
export async function createRevokeGuardianTransaction(
  accountAddress: Address,
  guardianAddress: Address,
  currentThreshold: bigint,
  module: SocialRecoveryModule = defaultSocialRecoveryModule
): Promise<MetaTransaction> {
  // Get current guardians to calculate new threshold
  const currentGuardians = await module.getGuardians(PUBLIC_RPC, accountAddress);
  const newGuardiansCount = currentGuardians.length - 1;

  // If we'll have 2 or fewer guardians left, require all of them
  const newThreshold = newGuardiansCount <= 2 ? BigInt(newGuardiansCount) : currentThreshold;

  return module.createRevokeGuardianWithThresholdMetaTransaction(
    PUBLIC_RPC,
    accountAddress,
    guardianAddress,
    newThreshold
  );
}

/**
 * Creates a transaction to enable the social recovery module
 * @param accountAddress The account address
 * @param module Optional SocialRecoveryModule instance (uses default if not provided)
 */
export function createEnableModuleTransaction(
  accountAddress: Address,
  module: SocialRecoveryModule = defaultSocialRecoveryModule
): MetaTransaction {
  return module.createEnableModuleMetaTransaction(accountAddress);
}

/**
 * Creates a transaction to add a guardian with threshold
 * @param guardianAddress The guardian to add
 * @param threshold The new threshold
 * @param module Optional SocialRecoveryModule instance (uses default if not provided)
 */
export function createAddGuardianTransaction(
  guardianAddress: Address,
  threshold: bigint,
  module: SocialRecoveryModule = defaultSocialRecoveryModule
): MetaTransaction {
  return module.createAddGuardianWithThresholdMetaTransaction(guardianAddress, threshold);
}

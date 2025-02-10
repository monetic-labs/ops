import { SocialRecoveryModule, SocialRecoveryModuleGracePeriodSelector } from "abstractionkit";
import { chain } from "@/config/web3";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";
import { Address } from "viem";
import { isLocal } from "../helpers";

class SocialRecoveryManager {
  private static instance: SocialRecoveryManager;
  private srm: SocialRecoveryModule;
  private static readonly backpackGuardianAddress = BACKPACK_GUARDIAN_ADDRESS;
  public rpcUrl = chain.rpcUrls.default.http[0];

  private constructor() {
    this.srm = new SocialRecoveryModule(SocialRecoveryModuleGracePeriodSelector.After7Days);
  }

  public static getInstance(): SocialRecoveryManager {
    if (!SocialRecoveryManager.instance) {
      SocialRecoveryManager.instance = new SocialRecoveryManager();
    }
    return SocialRecoveryManager.instance;
  }

  public async getGuardians(accountAddress: Address): Promise<Address[]> {
    return this.srm.getGuardians(this.rpcUrl, accountAddress) as Promise<Address[]>;
  }

  public async isBackpackGuardian(accountAddress: Address): Promise<boolean> {
    if (isLocal) return true; // TODO: deploy recovery module on base sepolia
    return await this.srm.isGuardian(this.rpcUrl, accountAddress, SocialRecoveryManager.backpackGuardianAddress);
  }

  public createEnableModuleTransaction(accountAddress: Address) {
    return this.srm.createEnableModuleMetaTransaction(accountAddress);
  }

  public createAddGuardianTransaction(guardianAddress: Address, threshold: bigint) {
    return this.srm.createAddGuardianWithThresholdMetaTransaction(guardianAddress, threshold);
  }

  public async createRevokeGuardianTransaction(accountAddress: Address, guardianAddress: Address, threshold: bigint) {
    return this.srm.createRevokeGuardianWithThresholdMetaTransaction(
      this.rpcUrl,
      accountAddress,
      guardianAddress,
      threshold
    );
  }
}

export const socialRecovery = SocialRecoveryManager.getInstance();

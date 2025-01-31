import { GasOption, type MetaTransaction, SafeAccountV0_3_0 as SafeAccount } from "abstractionkit";
import { Address } from "viem";

import { BUNDLER_URL, chain, SPONSORSHIP_POLICY_ID } from "@/config/web3";

import { BaseSafeAccountHelper } from "./base";

/**
 * Safe Account Helper for Public Key-based accounts
 */
export class PublicKeySafeAccountHelper extends BaseSafeAccountHelper {
  constructor(publicKey: Address) {
    // Initialize Safe account with public key
    const account = SafeAccount.initializeNewAccount([publicKey]);

    super(account, publicKey);
  }

  async createSponsoredUserOp(transactions: MetaTransaction[]) {
    // Create initial user operation
    const userOperation = await this.account.createUserOperation(
      transactions,
      chain.rpcUrls.default.http[0],
      BUNDLER_URL,
      {
        expectedSigners: [this.signer],
        gasLevel: GasOption.Fast,
      }
    );

    // Add sponsorship
    const [sponsoredUserOp] = await this.paymaster.createSponsorPaymasterUserOperation(
      userOperation,
      BUNDLER_URL,
      SPONSORSHIP_POLICY_ID
    );

    Object.assign(userOperation, sponsoredUserOp);

    return userOperation;
  }
}

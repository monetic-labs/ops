import {
  type WebauthnPublicKey,
  type MetaTransaction,
  SafeAccountV0_3_0 as SafeAccount,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
} from "abstractionkit";

import { BUNDLER_URL, chain, SPONSORSHIP_POLICY_ID } from "@/config/web3";
import { BaseSafeAccountHelper } from "./base";

/**
 * Safe Account Helper for WebAuthn-based accounts
 */
export class WebAuthnSafeAccountHelper extends BaseSafeAccountHelper {
  constructor(webauthPublicKey: WebauthnPublicKey) {
    // Initialize Safe account with WebAuthn public key
    const account = SafeAccount.initializeNewAccount([webauthPublicKey], {
      eip7212WebAuthnPrecompileVerifierForSharedSigner: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
    });

    super(account, webauthPublicKey);
  }

  async createSponsoredUserOp(transactions: MetaTransaction[]) {
    // Create initial user operation
    const userOperation = await this.account.createUserOperation(
      transactions,
      chain.rpcUrls.default.http[0],
      BUNDLER_URL,
      {
        expectedSigners: [this.signer],
        eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
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

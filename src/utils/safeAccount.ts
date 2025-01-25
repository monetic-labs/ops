import {
  type WebauthnPublicKey,
  type MetaTransaction,
  type SignerSignaturePair,
  SafeAccountV0_3_0 as SafeAccount,
  CandidePaymaster,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  UserOperationV7,
} from "abstractionkit";
import { entryPoint07Address } from "viem/account-abstraction";

import { BUNDLER_URL, chain, PAYMASTER_URL, SPONSORSHIP_POLICY_ID } from "@/config/web3";

export class SafeAccountHelper {
  private account: SafeAccount;
  private paymaster: CandidePaymaster;
  private webauthPublicKey: WebauthnPublicKey;

  constructor(webauthPublicKey: WebauthnPublicKey) {
    this.webauthPublicKey = webauthPublicKey;

    // Initialize Safe account with WebAuthn public key
    this.account = SafeAccount.initializeNewAccount([webauthPublicKey], {
      eip7212WebAuthnPrecompileVerifierForSharedSigner: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
      entrypointAddress: entryPoint07Address,
    });

    // Initialize paymaster for sponsorship
    this.paymaster = new CandidePaymaster(PAYMASTER_URL);
  }

  /**
   * Creates a sponsored user operation for the given transaction
   * @param transaction - Transaction to create user operation for
   * @returns User operation ready for signing
   */
  async createSponsoredUserOp(transaction: MetaTransaction) {
    // Create initial user operation
    const userOperation = await this.account.createUserOperation(
      [transaction],
      chain.rpcUrls.default.http[0],
      BUNDLER_URL,
      {
        expectedSigners: [this.webauthPublicKey],
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

  /**
   * Signs and sends a user operation
   * @param userOperation - User operation to sign and send
   * @param signerSignaturePair - Signature pair for the operation
   * @returns Receipt of the operation
   */
  async signAndSendUserOp(userOperation: UserOperationV7, signerSignaturePair: SignerSignaturePair) {
    // Format and set the signature
    userOperation.signature = SafeAccount.formatSignaturesToUseroperationSignature([signerSignaturePair], {
      isInit: userOperation.nonce == BigInt(0),
      eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
    });

    // Send the user operation
    const sendUserOperationResponse = await this.account.sendUserOperation(userOperation, BUNDLER_URL);
    const userOperationReceiptResult = await sendUserOperationResponse.included();

    return userOperationReceiptResult;
  }

  /**
   * Gets the user operation hash for signing
   * @param userOperation - User operation to get hash for
   * @returns Hash of the user operation
   */
  getUserOpHash(userOperation: UserOperationV7): string {
    return SafeAccount.getUserOperationEip712Hash(userOperation, BigInt(chain.id), {
      entrypointAddress: entryPoint07Address,
    });
  }

  /**
   * Gets the address of the Safe account
   * @returns Address of the Safe account
   */
  getAddress(): string {
    return this.account.accountAddress;
  }
}

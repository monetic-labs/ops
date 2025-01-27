import {
  type WebauthnPublicKey,
  type SignerSignaturePair,
  SafeAccountV0_3_0 as SafeAccount,
  CandidePaymaster,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  UserOperationV7,
} from "abstractionkit";
import { entryPoint07Address } from "viem/account-abstraction";
import { Address, Hex } from "viem";

import { BUNDLER_URL, chain, PAYMASTER_URL } from "@/config/web3";

/**
 * Base class for Safe Account management
 */
export abstract class BaseSafeAccountHelper {
  protected account: SafeAccount;
  protected paymaster: CandidePaymaster;
  protected signer: Address | WebauthnPublicKey;

  constructor(account: SafeAccount, signer: Address | WebauthnPublicKey) {
    this.account = account;
    this.signer = signer;
    this.paymaster = new CandidePaymaster(PAYMASTER_URL);
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
  getUserOpHash(userOperation: UserOperationV7): Hex {
    return SafeAccount.getUserOperationEip712Hash(userOperation, BigInt(chain.id), {
      entrypointAddress: entryPoint07Address,
    }) as Hex;
  }

  /**
   * Gets the address of the Safe account
   * @returns Address of the Safe account
   */
  getAddress(): Address {
    return this.account.accountAddress as Address;
  }
}

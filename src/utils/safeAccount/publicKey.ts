// import { GasOption, type MetaTransaction, SafeAccountV0_3_0 as SafeAccount, SignerSignaturePair } from "abstractionkit";
// import { Address } from "viem";

// import { BUNDLER_URL, chain, PUBLIC_RPC, SPONSORSHIP_POLICY_ID } from "@/config/web3";

// import { BaseSafeAccountHelper } from "./base";

// /**
//  * Safe Account Helper for Public Key-based accounts
//  */
// export class PublicKeySafeAccountHelper extends BaseSafeAccountHelper {
//   constructor(publicKey: Address) {
//     // Initialize Safe account with public key
//     const account = SafeAccount.initializeNewAccount([publicKey]);

//     super(account, publicKey);
//   }

//   async createSponsoredUserOp(transactions: MetaTransaction[], dummySignaturePair?: SignerSignaturePair) {
//     // Create initial user operation
//     const userOperation = await this.account.createUserOperation(transactions, PUBLIC_RPC, BUNDLER_URL, {
//       gasLevel: GasOption.Fast,
//       ...(!dummySignaturePair && { expectedSigners: [this.signer] }),
//       ...(dummySignaturePair && {
//         dummySignerSignaturePairs: [dummySignaturePair],
//       }),
//     });

//     // Add sponsorship
//     const [sponsoredUserOp] = await this.paymaster.createSponsorPaymasterUserOperation(
//       userOperation,
//       BUNDLER_URL,
//       SPONSORSHIP_POLICY_ID
//     );

//     Object.assign(userOperation, sponsoredUserOp);

//     return userOperation;
//   }
// }

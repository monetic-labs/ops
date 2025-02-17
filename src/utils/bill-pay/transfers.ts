import { Address, encodeFunctionData, erc20Abi, parseUnits } from "viem";
import {
  MetaTransaction,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  SafeAccountV0_3_0 as SafeAccount,
} from "abstractionkit";

import { TransferStatus } from "@/components/generics/transfer-status";
import { WebAuthnHelper } from "@/utils/webauthn";
import { BASE_USDC } from "@/utils/constants";
import {
  createAndSendSponsoredUserOp,
  createSettlementOperationWithApproval,
  sendAndTrackUserOperation,
  createSignedUserOperation,
} from "@/utils/safe";

import { WebAuthnCredentials } from "../localstorage";

import { safeAbi } from "./safeAbi";

type BuildNestedTransferParams = {
  individualAddress: Address;
  settlementAddress: Address;
  liquidationAddress: Address;
  amount: string;
  setTransferStatus: (status: TransferStatus) => void;
  credentials: WebAuthnCredentials;
};

/**
 * Builds and executes a nested safe transaction for bill pay transfers
 * The flow is:
 * 1. User signs with WebAuthn through their individual safe
 * 2. Individual safe approves the settlement safe's transaction
 * 3. Settlement safe executes the transfer with approved signature
 */
export const buildNestedTransfer = async ({
  individualAddress,
  settlementAddress,
  liquidationAddress,
  amount,
  credentials,
  setTransferStatus,
}: BuildNestedTransferParams) => {
  try {
    setTransferStatus(TransferStatus.PREPARING);

    // Log the addresses
    console.log("Individual Safe Address:", individualAddress);
    console.log("Settlement Safe Address:", settlementAddress);
    console.log("Liquidation Address:", liquidationAddress);

    const webauthnHelper = new WebAuthnHelper({
      publicKey: credentials.publicKey,
      credentialId: credentials.credentialId,
    });

    // Create account instances using the provided addresses
    const individualAccount = new SafeAccount(individualAddress);
    const settlementAccount = new SafeAccount(settlementAddress);

    // Create USDC transfer transaction
    const transferTransaction: MetaTransaction = {
      to: BASE_USDC.ADDRESS,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [liquidationAddress, parseUnits(amount, BASE_USDC.DECIMALS)],
      }),
    };

    // Create and sponsor settlement account operation
    const { userOp: settlementAccountUserOperation, hash: settlementOpHash } = await createAndSendSponsoredUserOp(
      settlementAccount.accountAddress as Address,
      [transferTransaction],
      {
        signer: individualAddress,
        isWebAuthn: true,
      }
    );

    // Create the approval transaction for the individual account
    const approveHashTransaction: MetaTransaction = {
      to: settlementAccount.accountAddress,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: safeAbi,
        functionName: "approveHash",
        args: [settlementOpHash],
      }),
    };

    setTransferStatus(TransferStatus.SIGNING);

    // Create and sponsor individual account operation
    const { userOp: individualAccountUserOperation, hash: individualOpHash } = await createAndSendSponsoredUserOp(
      individualAccount.accountAddress as Address,
      [approveHashTransaction],
      {
        signer: credentials.publicKey,
        isWebAuthn: true,
      }
    );

    // Sign and format the individual operation
    const { signature } = await webauthnHelper.signMessage(individualOpHash);
    const signedIndividualOp = createSignedUserOperation(
      individualAccount,
      individualAccountUserOperation,
      { signer: credentials.publicKey, signature },
      {
        isInit: individualAccountUserOperation.nonce === BigInt(0),
        precompileAddress: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
      }
    );

    console.log("Sending approve hash userOp for individual account");

    // Send and track individual account operation
    await sendAndTrackUserOperation(individualAccount, signedIndividualOp, {
      onSent: () => setTransferStatus(TransferStatus.SIGNING),
      onError: () => setTransferStatus(TransferStatus.ERROR),
      onSuccess: async () => {
        // Create and send settlement operation
        const updatedSettlementOp = createSettlementOperationWithApproval(
          individualAddress,
          settlementAccountUserOperation,
          DEFAULT_SECP256R1_PRECOMPILE_ADDRESS
        );

        await sendAndTrackUserOperation(settlementAccount, updatedSettlementOp, {
          onSent: () => setTransferStatus(TransferStatus.SENT),
          onError: () => setTransferStatus(TransferStatus.ERROR),
        });
      },
    });

    // Return early with success - actual tracking happens in background
    return { success: true };
  } catch (error) {
    console.error("Error in nested transfer:", error);
    setTransferStatus(TransferStatus.ERROR);
    throw error;
  }
};

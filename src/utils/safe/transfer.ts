import { Address, encodeFunctionData, erc20Abi, parseUnits } from "viem";
import {
  SafeAccountV0_3_0 as SafeAccount,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  MetaTransaction,
} from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/utils/localstorage";
import { safeAbi } from "@/utils/safe/abi";
import {
  createAndSendSponsoredUserOp,
  sendAndTrackUserOperation,
  createSignedUserOperation,
  createSettlementOperationWithApproval,
} from "@/utils/safe";

interface TransferCallbacks {
  onPreparing?: () => void;
  onSigning?: () => void;
  onSent?: () => void;
  onError?: (error: Error) => void;
}

interface TransferConfig {
  fromSafeAddress: Address;
  throughSafeAddress: Address;
  toAddress: Address;
  tokenAddress: Address;
  tokenDecimals: number;
  amount: string;
  credentials: WebAuthnCredentials;
  callbacks?: TransferCallbacks;
}

/**
 * Executes a nested transfer between safes
 * This is a nested transaction where:
 * 1. First safe approves the transfer
 * 2. Second safe executes the transfer with the approval
 */
export const executeNestedTransfer = async ({
  fromSafeAddress,
  throughSafeAddress,
  toAddress,
  tokenAddress,
  tokenDecimals,
  amount,
  credentials,
  callbacks,
}: TransferConfig): Promise<{ success: boolean }> => {
  try {
    callbacks?.onPreparing?.();

    const webauthnHelper = new WebAuthnHelper({
      publicKey: credentials.publicKey,
      credentialId: credentials.credentialId,
    });

    // Create account instances
    const fromSafe = new SafeAccount(fromSafeAddress);
    const throughSafe = new SafeAccount(throughSafeAddress);

    // Create token transfer transaction
    const transferTransaction: MetaTransaction = {
      to: tokenAddress,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [toAddress, parseUnits(amount, tokenDecimals)],
      }),
    };

    // Create and sponsor through-safe operation
    const { userOp: throughSafeUserOp, hash: throughSafeOpHash } = await createAndSendSponsoredUserOp(
      throughSafeAddress,
      [transferTransaction],
      {
        signer: fromSafeAddress,
        isWebAuthn: false,
      }
    );

    // Create approval transaction from first safe
    const approveHashTransaction: MetaTransaction = {
      to: throughSafeAddress,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: safeAbi,
        functionName: "approveHash",
        args: [throughSafeOpHash],
      }),
    };

    callbacks?.onSigning?.();

    // Create and sponsor from-safe operation
    const { userOp: fromSafeUserOp, hash: approvalHash } = await createAndSendSponsoredUserOp(
      fromSafeAddress,
      [approveHashTransaction],
      {
        signer: credentials.publicKey,
        isWebAuthn: true,
      }
    );

    // Sign and format the approval operation
    const { signature } = await webauthnHelper.signMessage(approvalHash);
    const signedFromSafeOp = createSignedUserOperation(
      fromSafeUserOp,
      { signer: credentials.publicKey, signature },
      { precompileAddress: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS }
    );

    // Send and track both operations
    await sendAndTrackUserOperation(fromSafe, signedFromSafeOp, {
      onSent: callbacks?.onSigning,
      onError: callbacks?.onError,
      onSuccess: async () => {
        // Create and send through-safe operation with approval
        const finalThroughSafeOp = createSettlementOperationWithApproval(
          fromSafeAddress,
          throughSafeUserOp,
          DEFAULT_SECP256R1_PRECOMPILE_ADDRESS
        );

        await sendAndTrackUserOperation(throughSafe, finalThroughSafeOp, {
          onSent: callbacks?.onSent,
          onError: callbacks?.onError,
        });
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error in nested transfer:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

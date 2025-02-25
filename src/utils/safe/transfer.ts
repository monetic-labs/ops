import { Address, encodeFunctionData, erc20Abi, parseUnits } from "viem";
import {
  SafeAccountV0_3_0 as SafeAccount,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  MetaTransaction,
} from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/utils/localstorage";
import { safeAbi } from "@/utils/abi/safe";
import {
  createAndSendSponsoredUserOp,
  sendAndTrackUserOperation,
  createSignedUserOperation,
  createSettlementOperationWithApproval,
} from "@/utils/safe";

interface TransferCallbacks {
  onPreparing?: () => void;
  onSigning?: () => void;
  onSigningComplete?: () => void;
  onSent?: () => void;
  onSuccess?: () => void;
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

    // Call onSigningComplete callback after signing is complete
    callbacks?.onSigningComplete?.();

    // Create a promise that will resolve when the entire transfer process is complete
    return new Promise((resolve, reject) => {
      // Send and track both operations
      sendAndTrackUserOperation(fromSafe, signedFromSafeOp, {
        onSent: callbacks?.onSigning,
        onError: (error) => {
          callbacks?.onError?.(error);
          reject(error);
        },
        onSuccess: async () => {
          try {
            // Create and send through-safe operation with approval
            const finalThroughSafeOp = createSettlementOperationWithApproval(
              fromSafeAddress,
              throughSafeUserOp,
              DEFAULT_SECP256R1_PRECOMPILE_ADDRESS
            );

            // Only call onSent callback here, as this is when the final transaction is sent
            callbacks?.onSent?.();

            await sendAndTrackUserOperation(throughSafe, finalThroughSafeOp, {
              onError: (error) => {
                callbacks?.onError?.(error);
                reject(error);
              },
              onSuccess: () => {
                // Only call onSuccess when the entire process is complete
                callbacks?.onSuccess?.();
                resolve({ success: true });
              },
            });
          } catch (error) {
            console.error("Error in nested transfer (second phase):", error);
            callbacks?.onError?.(error as Error);
            reject(error);
          }
        },
      }).catch((error) => {
        console.error("Error in nested transfer (first phase):", error);
        callbacks?.onError?.(error as Error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error in nested transfer setup:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

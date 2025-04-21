import { Address, Hex } from "viem";
import { RainWithdrawalSignatureReady } from "@monetic-labs/sdk";

import pylon from "@/libs/monetic-sdk";
import { WebAuthnCredentials } from "@/types/webauthn";

import { createRainWithdrawalTemplate } from "../templates";
import { executeNestedTransaction } from "../flows/nested";
import { DirectTransactionCallbacks } from "../flows/direct";

/**
 * Configuration for Rain Card transfer operations
 */
interface RainCardTransferConfig {
  fromSafeAddress: Address;
  throughSafeAddress: Address;
  toAddress: Address;
  tokenAddress: Address;
  tokenDecimals: number;
  rainControllerAddress: Address;
  rainCollateralProxyAddress: Address;
  amount: string;
  credentials: WebAuthnCredentials;
  callbacks?: DirectTransactionCallbacks;
}

/**
 * Retrieves a withdrawal signature from the backend with retry capability
 * If signature generation is pending, it will wait and retry
 *
 * @param amount Amount to withdraw
 * @param adminAddress Admin address of the Rain Card
 * @param recipientAddress Recipient address for the withdrawal
 * @param callbacks Optional callbacks for progress updates
 * @returns The withdrawal signature
 */
const getWithdrawalSignatureWithRetry = async (
  amount: string,
  adminAddress: Address,
  recipientAddress: Address,
  callbacks?: DirectTransactionCallbacks
): Promise<RainWithdrawalSignatureReady["signature"]> => {
  while (true) {
    const response = await pylon.requestWithdrawalSignatureForRainAccount({
      amount,
      adminAddress,
      recipientAddress,
    });

    if (response.status === "pending") {
      // Notify UI that we're waiting for signature generation
      callbacks?.onPreparing?.();
      // Wait for the specified retry time
      await new Promise((resolve) => setTimeout(resolve, response.retryAfter * 1000));
      continue;
    }

    // We have a ready signature
    return response.signature;
  }
};

/**
 * Executes a nested transfer from Rain Card Account to a safe
 * This is a specialized withdrawal flow for Rain Card accounts
 *
 * The flow consists of:
 * 1. First we get a withdrawal signature from Pylon
 * 2. Then we create a userOp to withdraw from the Rain Card Account to the safe
 * 3. First safe approves the transfer
 * 4. Second safe executes the transfer with the approval
 *
 * @param config Configuration for the Rain Card transfer
 * @returns Promise that resolves when the transfer completes successfully
 */
export const executeNestedTransferFromRainCardAcccount = async ({
  fromSafeAddress,
  throughSafeAddress,
  toAddress,
  tokenAddress,
  tokenDecimals,
  rainControllerAddress,
  rainCollateralProxyAddress,
  amount,
  credentials,
  callbacks,
}: RainCardTransferConfig): Promise<{ success: boolean }> => {
  try {
    callbacks?.onPreparing?.();

    // Get withdrawal signature with retry logic
    const {
      data: withdrawalSignature,
      salt: withdrawalSalt,
      expiresAt: withdrawalExpiresAt,
    } = await getWithdrawalSignatureWithRetry(amount, rainCollateralProxyAddress, toAddress, callbacks);

    // Create the withdrawal transaction
    const withdrawalTx = createRainWithdrawalTemplate({
      rainControllerAddress,
      rainCollateralProxyAddress,
      tokenAddress,
      tokenAmount: amount,
      tokenDecimals,
      toAddress,
      expiresAtTimestamp: withdrawalExpiresAt,
      withdrawalSalt: withdrawalSalt as Hex,
      withdrawalSignature: withdrawalSignature as Hex,
    });

    // Execute the nested transaction with the withdrawal template
    return executeNestedTransaction({
      fromSafeAddress,
      throughSafeAddress,
      transactions: [withdrawalTx],
      credentials,
      callbacks,
    });
  } catch (error) {
    console.error("Error in Rain Card withdrawal setup:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

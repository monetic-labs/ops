import { Address } from "viem";
import {
  RecoveryWalletMethod,
  RecoveryWalletGenerateInput,
  RecoveryWalletGenerateOutput,
} from "@backpack-fux/pylon-sdk";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/utils/localstorage";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";
import { createAndSendSponsoredUserOp, sendUserOperation } from "@/utils/safe";
import { createEnableModuleTransaction, createAddGuardianTransaction } from "@/utils/socialRecovery";
import pylon from "@/libs/pylon-sdk";

interface OnboardSafeCallbacks {
  onRecoverySetup?: () => void;
  onError?: (error: Error) => void;
}

interface OnboardSafeParams {
  walletAddress: Address;
  credentials: WebAuthnCredentials;
  recoveryMethods: {
    email: string;
    phone: string;
  };
  callbacks?: OnboardSafeCallbacks;
}

/**
 * Sets up social recovery for a newly created safe account
 * This includes:
 * 1. Generating recovery wallets
 * 2. Enabling the social recovery module
 * 3. Adding guardians (Backpack + recovery wallets)
 */
export const setupSocialRecovery = async ({
  walletAddress,
  credentials,
  recoveryMethods,
  callbacks,
}: OnboardSafeParams): Promise<Address[]> => {
  try {
    // Initialize WebAuthn helper
    const webauthnHelper = new WebAuthnHelper({
      credentialId: credentials.credentialId,
      publicKey: credentials.publicKey,
    });

    // Generate recovery wallets
    const recoveryInputs: RecoveryWalletGenerateInput[] = [
      { identifier: recoveryMethods.email, method: RecoveryWalletMethod.EMAIL },
      { identifier: recoveryMethods.phone, method: RecoveryWalletMethod.PHONE },
    ];

    const recoveryWallets = await pylon.generateRecoveryWallets(recoveryInputs);

    // Create social recovery transactions
    const guardianAddresses = [
      BACKPACK_GUARDIAN_ADDRESS as Address,
      ...recoveryWallets.map((wallet: RecoveryWalletGenerateOutput) => wallet.publicAddress as Address),
    ];

    // Create enable module and add guardian transactions
    const enableModuleTx = createEnableModuleTransaction(walletAddress);
    const addGuardianTxs = guardianAddresses.map((address) => createAddGuardianTransaction(address, BigInt(2)));

    const socialRecoveryTxs = [enableModuleTx, ...addGuardianTxs];

    // Create and sponsor user operation
    const { userOp, hash } = await createAndSendSponsoredUserOp(walletAddress, socialRecoveryTxs, {
      signer: credentials.publicKey,
      isWebAuthn: true,
    });

    // Sign the operation
    const signature = await webauthnHelper.signMessage(hash);

    // Send the operation
    const response = await sendUserOperation(walletAddress, userOp, {
      signer: credentials.publicKey,
      signature: signature.signature,
    });

    // Wait for receipt
    const receipt = await response.included();

    if (!receipt.success) {
      throw new Error("Failed to setup social recovery");
    }

    callbacks?.onRecoverySetup?.();

    return guardianAddresses;
  } catch (error) {
    console.error("Error setting up social recovery:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

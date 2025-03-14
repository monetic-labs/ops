import { Address } from "viem";
import {
  RecoveryWalletMethod,
  RecoveryWalletGenerateInput,
  RecoveryWalletGenerateOutput,
} from "@backpack-fux/pylon-sdk";
import { SafeAccountV0_3_0 as SafeAccount } from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";
import { createAndSendSponsoredUserOp, sendUserOperation, createDeployTransaction } from "@/utils/safe";
import { createEnableModuleTransaction, createAddGuardianTransaction } from "@/utils/socialRecovery";
import pylon from "@/libs/pylon-sdk";

interface OnboardSafeCallbacks {
  onRecoverySetup?: () => void;
  onError?: (error: Error) => void;
  onDeployment?: () => void;
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

interface DeploySafeParams {
  credentials: WebAuthnCredentials;
  recoveryMethods: {
    email: string;
    phone: string;
  };
  callbacks?: OnboardSafeCallbacks;
  individualSafeAccount: SafeAccount;
  settlementSafeAddress: Address;
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
    const { signature } = await webauthnHelper.signMessage(hash);

    // Send the operation
    const response = await sendUserOperation(walletAddress, userOp, {
      signer: credentials.publicKey,
      signature,
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

/**
 * Deploys a new individual safe account and sets up social recovery in a single transaction
 * This handles both the initial deployments and social recovery setup
 */
export const deployAndSetupSafe = async ({
  credentials,
  recoveryMethods,
  callbacks,
  individualSafeAccount,
  settlementSafeAddress,
}: DeploySafeParams): Promise<{ address: Address; settlementAddress?: Address }> => {
  try {
    // Initialize WebAuthn helper
    const webauthnHelper = new WebAuthnHelper({
      credentialId: credentials.credentialId,
      publicKey: credentials.publicKey,
    });

    // Get the individual account address
    const individualAddr = individualSafeAccount.accountAddress as Address;

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

    // Create all transactions in the correct order
    const enableModuleTx = createEnableModuleTransaction(individualAddr);
    const addGuardianTxs = guardianAddresses.map((address, index) => 
      createAddGuardianTransaction(address, index === 0 ? BigInt(1) : BigInt(2))
    );

    // Combine all transactions in order
    const allTransactions = [enableModuleTx, ...addGuardianTxs];

    // Deploy the settlement account using the individual account as the deployer
    const deploySettlementTx = createDeployTransaction([individualAddr]);
    allTransactions.push(deploySettlementTx);

    // Create and send user operation for deployment and setup
    const { userOp, hash } = await createAndSendSponsoredUserOp(individualAddr, allTransactions, {
      signer: credentials.publicKey,
      isWebAuthn: true,
      safeAccount: individualSafeAccount,
    });

    // Call the deployment callback here before signing
    callbacks?.onDeployment?.();

    // Sign the operation
    const { signature: signatureData } = await webauthnHelper.signMessage(hash);

    // Send the operation with initialization
    const response = await sendUserOperation(individualAddr, userOp, {
      signer: credentials.publicKey,
      signature: signatureData,
    });

    // Wait for the account to be deployed and setup
    const receipt = await response.included();
    if (!receipt.success) {
      throw new Error("Failed to deploy and setup safe account");
    }

    // Call the recovery setup callback after successful deployment
    callbacks?.onRecoverySetup?.();

    return { address: individualAddr, settlementAddress: settlementSafeAddress };
  } catch (error) {
    console.error("Error deploying and setting up safe:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

import { Address } from "viem";
import { SafeAccountV0_3_0 as SafeAccount } from "abstractionkit";

import { WebAuthnCredentials } from "@/types/webauthn";

import { createSafeAccount } from "../core/account";
import { createDeployTransaction } from "../core/operations";
import { executeDirectTransaction, DirectTransactionCallbacks } from "../flows/direct";

import { createPasskeyCredentials } from "./passkey";
import { RecoveryMethods, generateRecoveryAddresses, createRecoveryTransactions } from "./recovery";
import { MONETIC_GUARDIAN_ADDRESS } from "@/utils/constants";

// Interface for deploy callbacks
interface DeployCallbacks extends DirectTransactionCallbacks {
  onPasskeyCreated?: () => void;
  onRecoverySetup?: () => void;
  onDeployment?: () => void;
}

// Configuration for individual account deployment
interface DeploySafeConfig {
  // Required for new account creation
  email?: string;
  phone?: string;

  // Optional parameters for using existing credentials and account
  credentials?: WebAuthnCredentials;
  individualSafeAccount?: SafeAccount;
  settlementSafeAddress?: Address;

  // Options
  deploySettlement?: boolean;
  recoveryMethods?: RecoveryMethods;
  callbacks?: DeployCallbacks;
}

/**
 * Creates and deploys an individual Safe account with social recovery
 * Option to also deploy a settlement account
 *
 * @param config Configuration for the deployment
 * @returns The deployed account address and credentials
 */
export const deployIndividualSafe = async ({
  email,
  phone,
  deploySettlement = false,
  callbacks,
  credentials: existingCredentials,
  individualSafeAccount,
  settlementSafeAddress: existingSettlementAddress,
  recoveryMethods,
}: DeploySafeConfig): Promise<{
  address: Address;
  credentials: WebAuthnCredentials;
  settlementAddress?: Address;
}> => {
  try {
    // Determine if using existing account or creating new one
    const isUsingExistingAccount = individualSafeAccount !== undefined && existingCredentials !== undefined;

    // Create credentials if not provided
    let credentials = existingCredentials;
    let individualAddress: Address;
    let safeAccount: SafeAccount;

    if (!isUsingExistingAccount) {
      // Validate required parameters for new account creation
      if (!email || !phone) {
        throw new Error("Email and phone are required for new account creation");
      }

      // Create a new passkey
      credentials = await createPasskeyCredentials(email);
      callbacks?.onPasskeyCreated?.();

      // Create the individual safe account
      const accountResult = createSafeAccount({
        signers: [credentials.publicKey],
        isWebAuthn: true,
        threshold: 1,
      });

      individualAddress = accountResult.address;
      safeAccount = accountResult.instance;
    } else {
      // Use existing account
      individualAddress = individualSafeAccount.accountAddress as Address;
      safeAccount = individualSafeAccount;
    }

    // Generate recovery wallet addresses
    let guardianAddresses: Address[] = [];
    if (recoveryMethods) {
      guardianAddresses = await generateRecoveryAddresses(recoveryMethods);
    } else {
      guardianAddresses = [MONETIC_GUARDIAN_ADDRESS as Address];
    }

    // Create all necessary transactions
    const allTransactions = [];

    // Only include deploy transaction for new accounts
    if (!isUsingExistingAccount) {
      const deployTx = createDeployTransaction([individualAddress], 1);

      allTransactions.push(deployTx);
    }

    // Add recovery transactions
    const recoveryTxs = createRecoveryTransactions(individualAddress, guardianAddresses);

    allTransactions.push(...recoveryTxs);

    // Add settlement account deployment if requested
    let settlementAddress: Address | undefined = existingSettlementAddress;

    if (deploySettlement) {
      const deploySettlementTx = createDeployTransaction([individualAddress]);

      allTransactions.push(deploySettlementTx);

      // Calculate the settlement address if not provided
      if (!settlementAddress) {
        settlementAddress = SafeAccount.createAccountAddress([individualAddress], {
          threshold: 1,
        }) as Address;
      }
    }

    // Execute the transactions
    await executeDirectTransaction({
      safeAddress: individualAddress,
      transactions: allTransactions,
      credentials: credentials!,
      callbacks: {
        onPreparing: callbacks?.onPreparing,
        onSigning: callbacks?.onDeployment || callbacks?.onSigning,
        onSigningComplete: callbacks?.onSigningComplete,
        onSent: callbacks?.onSent,
        onError: callbacks?.onError,
        onSuccess: () => {
          callbacks?.onRecoverySetup?.();
          callbacks?.onSuccess?.();
        },
      },
    });

    return {
      address: individualAddress,
      credentials: credentials!,
      settlementAddress,
    };
  } catch (error) {
    console.error("Error deploying individual safe:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

import { Address, encodeFunctionData } from "viem";
import { SafeAccountV0_3_0 as SafeAccount, DEFAULT_SECP256R1_PRECOMPILE_ADDRESS } from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/utils/localstorage";
import { safeAbi } from "@/utils/abi/safe";
import {
  createSafeAccount,
  createAndSendSponsoredUserOp,
  createSubAccountDeploymentTransactions,
  sendAndTrackUserOperation,
  createSignedUserOperation,
  createSettlementOperationWithApproval,
} from "@/utils/safe";

interface DeploymentCallbacks {
  onSent?: () => void;
  onSuccess?: (safeAddress: Address) => void;
  onError?: (error: Error) => void;
}

interface DeploymentConfig {
  individualSafeAddress: Address;
  credentials: WebAuthnCredentials;
  signerAddresses: Address[];
  threshold: number;
  callbacks?: DeploymentCallbacks;
}

/**
 * Deploys a new Safe account through an existing individual safe account
 * This is a nested transaction where:
 * 1. Individual account approves the deployment
 * 2. New safe account is deployed with the approval
 */
export const deploySafeAccount = async ({
  individualSafeAddress,
  credentials,
  signerAddresses,
  threshold,
  callbacks,
}: DeploymentConfig): Promise<{ safeAddress: Address }> => {
  try {
    // Initialize WebAuthn helper
    const webauthnHelper = new WebAuthnHelper({
      credentialId: credentials.credentialId,
      publicKey: credentials.publicKey,
    });

    // Create the individual account instance
    const individualAccount = new SafeAccount(individualSafeAddress);

    // Create the new safe account to be deployed
    const { address: safeSubAccountAddress, instance: safeAccount } = createSafeAccount({
      signers: [individualSafeAddress],
      isWebAuthn: false,
    });

    // Create deployment transactions
    const deploymentTxs = await createSubAccountDeploymentTransactions(
      safeAccount,
      individualSafeAddress,
      signerAddresses,
      threshold
    );

    // Create and sponsor deployment operation
    const { userOp: deploymentUserOp, hash: deploymentHash } = await createAndSendSponsoredUserOp(
      safeSubAccountAddress,
      deploymentTxs,
      {
        signer: individualSafeAddress,
        isWebAuthn: false,
      }
    );

    // Create approval transaction from individual account
    const approveHashTransaction = {
      to: safeSubAccountAddress,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: safeAbi,
        functionName: "approveHash",
        args: [deploymentHash],
      }),
    };

    // Get approval from individual account
    const { userOp: individualApprovalOp, hash: approvalHash } = await createAndSendSponsoredUserOp(
      individualSafeAddress,
      [approveHashTransaction],
      {
        signer: credentials.publicKey,
        isWebAuthn: true,
      }
    );

    // Sign and send the approval
    const { signature } = await webauthnHelper.signMessage(approvalHash);
    const signedApprovalOp = createSignedUserOperation(
      individualApprovalOp,
      { signer: credentials.publicKey, signature },
      { precompileAddress: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS }
    );

    // Execute the deployment with approval
    const finalDeploymentOp = createSettlementOperationWithApproval(
      individualSafeAddress,
      deploymentUserOp,
      DEFAULT_SECP256R1_PRECOMPILE_ADDRESS
    );

    // Track both operations
    await sendAndTrackUserOperation(individualAccount, signedApprovalOp, {
      onSent: callbacks?.onSent,
      onError: callbacks?.onError,
      onSuccess: async () => {
        await sendAndTrackUserOperation(safeAccount, finalDeploymentOp, {
          onSent: callbacks?.onSent,
          onSuccess: () => callbacks?.onSuccess?.(safeSubAccountAddress),
          onError: callbacks?.onError,
        });
      },
    });

    return { safeAddress: safeSubAccountAddress };
  } catch (error) {
    console.error("Error deploying safe account:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

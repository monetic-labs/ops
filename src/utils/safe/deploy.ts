import { Address } from "viem";
import {
  SafeAccountV0_3_0 as SafeAccount,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  GasOption,
  UserOperationV7,
} from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";
import { safeAbi } from "@/utils/abi/safe";
import {
  createSafeAccount,
  createAndSendSponsoredUserOp,
  createSubAccountDeploymentTransactions,
  sendAndTrackUserOperation,
  createSignedUserOperation,
  createSettlementOperationWithApproval,
  sponsorUserOperation,
  getUserOpHash,
  sendUserOperation,
  trackUserOperationResponse,
} from "@/utils/safe";
import { createApproveHashTemplate } from "@/utils/safe/templates";
import { BUNDLER_URL, PUBLIC_RPC } from "@/config/web3";

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
 * This is a direct deployment approach following Candide's documentation for initial deployments
 */
export const deploySafeAccount = async ({
  individualSafeAddress,
  credentials,
  signerAddresses,
  threshold,
  callbacks,
}: DeploymentConfig): Promise<{ safeAddress: Address }> => {
  try {
    console.log("Starting safe account deployment with parameters:", {
      individualSafeAddress,
      signerAddresses,
      threshold,
    });

    // Initialize WebAuthn helper
    const webauthnHelper = new WebAuthnHelper({
      credentialId: credentials.credentialId,
      publicKey: credentials.publicKey,
    });

    // Create the new safe account to be deployed
    const { address: safeSubAccountAddress, instance: safeAccount } = createSafeAccount({
      signers: [individualSafeAddress],
      isWebAuthn: false,
    });

    console.log("Created safe account:", safeSubAccountAddress);

    // Create deployment transactions
    const deploymentTxs = await createSubAccountDeploymentTransactions(
      safeAccount,
      individualSafeAddress,
      signerAddresses,
      threshold
    );

    console.log("Created deployment transactions:", deploymentTxs);

    // Following Candide's approach for initial deployments
    return new Promise((resolve, reject) => {
      try {
        // Create user operation directly
        safeAccount
          .createUserOperation(deploymentTxs, PUBLIC_RPC, BUNDLER_URL)
          .then(async (userOp) => {
            console.log("Created user operation for deployment");

            try {
              // Get the hash to sign
              const userOpHash = getUserOpHash(userOp);
              console.log("User operation hash for signing:", userOpHash);

              // Sign the hash with WebAuthn
              const { signature } = await webauthnHelper.signMessage(userOpHash);
              console.log("Signed user operation hash");

              // Create signed user operation
              const signedUserOp = createSignedUserOperation(
                userOp,
                { signer: credentials.publicKey, signature },
                { precompileAddress: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS }
              );
              console.log("Created signed user operation");

              // Send the user operation directly
              const response = await sendUserOperation(safeSubAccountAddress, signedUserOp, {
                signer: credentials.publicKey,
                signature,
              });
              console.log("Sent user operation, tracking response");

              // Track the user operation
              await trackUserOperationResponse(response, {
                onSent: () => {
                  console.log("User operation sent");
                  callbacks?.onSent?.();
                },
                onSuccess: () => {
                  console.log("Deployment successful");
                  callbacks?.onSuccess?.(safeSubAccountAddress);
                  resolve({ safeAddress: safeSubAccountAddress });
                },
                onError: (error) => {
                  console.error("Error in deployment:", error);
                  callbacks?.onError?.(error);
                  reject(error);
                },
              });
            } catch (error) {
              console.error("Error in deployment process:", error);
              callbacks?.onError?.(error as Error);
              reject(error);
            }
          })
          .catch((error) => {
            console.error("Error creating user operation:", error);
            callbacks?.onError?.(error as Error);
            reject(error);
          });
      } catch (error) {
        console.error("Error in deployment setup:", error);
        callbacks?.onError?.(error as Error);
        reject(error);
      }
    });
  } catch (error) {
    console.error("Error in deployment setup:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

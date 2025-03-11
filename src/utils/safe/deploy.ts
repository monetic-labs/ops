import { Address } from "viem";
import { SafeAccountV0_3_0 as SafeAccount, DEFAULT_SECP256R1_PRECOMPILE_ADDRESS } from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";
import {
  createSafeAccount,
  createDeployTransaction,
  createAndSendSponsoredUserOp,
  sendAndTrackUserOperation,
  createSignedUserOperation,
} from "@/utils/safe";

interface DeploymentCallbacks {
  onPreparing?: () => void;
  onSigning?: () => void;
  onSigningComplete?: () => void;
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
 * Deploys a new Safe sub-account using a simpler direct approach
 * 1. First, deploy the sub-account with initial signers
 * 2. Later, configure additional signers and threshold in a separate operation
 */
export const deploySafeAccount = async ({
  individualSafeAddress,
  credentials,
  signerAddresses,
  threshold,
  callbacks,
}: DeploymentConfig): Promise<{ safeAddress: Address }> => {
  try {
    callbacks?.onPreparing?.();

    const webauthnHelper = new WebAuthnHelper({
      publicKey: credentials.publicKey,
      credentialId: credentials.credentialId,
    });

    // Create account instances
    const individualAccount = new SafeAccount(individualSafeAddress);

    // Create the new settlement account to be deployed
    // Include all signers directly in the initial deployment
    const allSigners = [individualSafeAddress, ...signerAddresses.filter((addr) => addr !== individualSafeAddress)];

    // Calculate the settlement account address
    const { address: settlementAccountAddress } = createSafeAccount({
      signers: allSigners,
      isWebAuthn: false,
      threshold,
    });

    // Create a simple deployment transaction with all signers
    const deployTx = createDeployTransaction(allSigners, threshold);

    // Create and sponsor individual account operation to deploy the settlement account
    const { userOp: deployUserOp, hash: deployHash } = await createAndSendSponsoredUserOp(
      individualSafeAddress,
      [deployTx],
      {
        signer: credentials.publicKey,
        isWebAuthn: true,
      }
    );

    callbacks?.onSigning?.();

    // Sign the deployment operation
    const { signature } = await webauthnHelper.signMessage(deployHash);
    const signedDeployOp = createSignedUserOperation(
      deployUserOp,
      { signer: credentials.publicKey, signature },
      { precompileAddress: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS }
    );

    callbacks?.onSigningComplete?.();

    // Create a promise that will resolve when the deployment is complete
    return new Promise((resolve, reject) => {
      // Send and track the deployment operation
      sendAndTrackUserOperation(individualAccount, signedDeployOp, {
        onSent: callbacks?.onSent,
        onError: (error) => {
          console.error("Error in deployment:", error);
          callbacks?.onError?.(error);
          reject(error);
        },
        onSuccess: () => {
          console.log("Settlement account deployed successfully:", settlementAccountAddress);
          callbacks?.onSuccess?.(settlementAccountAddress);
          resolve({ safeAddress: settlementAccountAddress });
        },
      }).catch((error) => {
        console.error("Error in deployment:", error);
        callbacks?.onError?.(error as Error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error in deployment setup:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

import { Address } from "viem";
import { SafeAccountV0_3_0 as SafeAccount, DEFAULT_SECP256R1_PRECOMPILE_ADDRESS } from "abstractionkit";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnCredentials } from "@/types/webauthn";
import { createSafeAccount } from "../core/account";
import {
  createDeployTransaction,
  createAndSendSponsoredUserOp,
  sendAndTrackUserOperation,
  createSignedUserOperation,
} from "../core/operations";
import { DirectTransactionCallbacks } from "../flows/direct";

/**
 * Callbacks for subaccount deployment
 */
export interface SubAccountCallbacks {
  onPreparing?: () => void;
  onSigning?: () => void;
  onSigningComplete?: () => void;
  onSent?: () => void;
  onError?: (error: Error) => void;
  onSuccess?: (safeAddress: Address) => void;
}

/**
 * Configuration for subaccount deployment
 */
export interface SubAccountConfig {
  individualSafeAddress: Address;
  credentials: WebAuthnCredentials;
  signerAddresses: Address[];
  threshold: number;
  callbacks?: SubAccountCallbacks;
}

/**
 * Deploys a new Safe sub-account using the primary individual account
 * The sub-account will be deployed with the specified signers and threshold
 *
 * @param config Configuration for subaccount deployment
 * @returns Promise with the deployed subaccount address
 */
export const deploySubAccount = async ({
  individualSafeAddress,
  credentials,
  signerAddresses,
  threshold,
  callbacks,
}: SubAccountConfig): Promise<{ safeAddress: Address }> => {
  try {
    callbacks?.onPreparing?.();

    const webauthnHelper = new WebAuthnHelper({
      publicKey: credentials.publicKey,
      credentialId: credentials.credentialId,
    });

    // Create account instances
    const individualAccount = new SafeAccount(individualSafeAddress);

    // Create the new subaccount to be deployed
    // Include all signers directly in the initial deployment
    const allSigners = [individualSafeAddress, ...signerAddresses.filter((addr) => addr !== individualSafeAddress)];

    // Calculate the subaccount address
    const { address: subaccountAddress } = createSafeAccount({
      signers: allSigners,
      isWebAuthn: false,
      threshold,
    });

    // Create a simple deployment transaction with all signers
    const deployTx = createDeployTransaction(allSigners, threshold);

    // Create and sponsor individual account operation to deploy the subaccount
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
          console.error("Error in subaccount deployment:", error);
          callbacks?.onError?.(error);
          reject(error);
        },
        onSuccess: () => {
          console.log("Subaccount deployed successfully:", subaccountAddress);
          if (callbacks?.onSuccess) {
            callbacks.onSuccess(subaccountAddress);
          }
          resolve({ safeAddress: subaccountAddress });
        },
      }).catch((error) => {
        console.error("Error in subaccount deployment:", error);
        callbacks?.onError?.(error as Error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error in subaccount deployment setup:", error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

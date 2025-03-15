import { Address } from "viem";

import { WebAuthnHelper } from "@/utils/webauthn";
import { useUser } from "@/contexts/UserContext";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";
import {
  createRevokeGuardianTransaction,
  createEnableModuleTransaction,
  createAddGuardianTransaction,
} from "@/utils/safe/recovery";
import { createAndSendSponsoredUserOp, sendUserOperation } from "@/utils/safe";

type UseBackpackRecoveryHandlersProps = {
  isEnabled: boolean;
  setIsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  threshold: number;
  userAddress?: string;
};

export const useBackpackRecoveryHandlers = ({
  isEnabled,
  setIsEnabled,
  threshold,
  userAddress,
}: UseBackpackRecoveryHandlersProps) => {
  const { credentials } = useUser();

  const handleToggle = async () => {
    if (!userAddress || !credentials) return;

    try {
      const webauthn = new WebAuthnHelper({
        publicKey: credentials.publicKey,
        credentialId: credentials.credentialId,
      });
      const walletAddress = userAddress as Address;
      const signer = credentials.publicKey;

      if (!isEnabled) {
        // Enable Backpack as guardian
        const enableModuleTx = createEnableModuleTransaction(walletAddress);
        const addGuardianTx = createAddGuardianTransaction(BACKPACK_GUARDIAN_ADDRESS, BigInt(threshold));

        // Create and sponsor user operation
        const { userOp, hash } = await createAndSendSponsoredUserOp(walletAddress, [enableModuleTx, addGuardianTx], {
          signer,
          isWebAuthn: true,
        });

        // Sign and send operation
        const signature = await webauthn.signMessage(hash);

        await sendUserOperation(walletAddress, userOp, {
          signer,
          signature: signature.signature,
        });
      } else {
        // Disable Backpack as guardian
        const revokeGuardianTx = await createRevokeGuardianTransaction(
          walletAddress,
          BACKPACK_GUARDIAN_ADDRESS as Address,
          BigInt(threshold)
        );

        // Create and sponsor user operation
        const { userOp, hash } = await createAndSendSponsoredUserOp(walletAddress, [revokeGuardianTx], {
          signer,
          isWebAuthn: true,
        });

        // Sign and send operation
        const signature = await webauthn.signMessage(hash);

        await sendUserOperation(walletAddress, userOp, {
          signer,
          signature: signature.signature,
        });
      }

      setIsEnabled((prev) => !prev);
    } catch (error) {
      console.error("Failed to toggle Backpack recovery:", error);
    }
  };

  return {
    handleToggle,
  };
};

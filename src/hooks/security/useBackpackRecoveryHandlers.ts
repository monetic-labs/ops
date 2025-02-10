import { PendingChanges } from "./types";
import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnSafeAccountHelper } from "@/utils/safeAccount";
import { LocalStorage } from "@/utils/localstorage";
import { socialRecovery } from "@/utils/safeAccount/socialRecovery";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";

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
  const handleToggle = async () => {
    if (!userAddress) return;

    try {
      const safeUser = LocalStorage.getSafeUser();
      const webauthn = new WebAuthnHelper({
        publicKey: safeUser?.publicKey,
        credentialId: safeUser?.passkeyId,
      });
      const safeAccountHelper = new WebAuthnSafeAccountHelper(safeUser?.publicKeyCoordinates);

      if (!isEnabled) {
        const enableModuleTx = socialRecovery.createEnableModuleTransaction(userAddress as `0x${string}`);
        const addGuardianTx = socialRecovery.createAddGuardianTransaction(
          BACKPACK_GUARDIAN_ADDRESS as `0x${string}`,
          BigInt(threshold)
        );

        const userOp = await safeAccountHelper.createSponsoredUserOp([enableModuleTx, addGuardianTx]);
        const userOpHash = safeAccountHelper.getUserOpHash(userOp);
        const signature = await webauthn.signMessage(userOpHash);
        await safeAccountHelper.signAndSendUserOp(userOp, signature);
      } else {
        const revokeGuardianTx = await socialRecovery.createRevokeGuardianTransaction(
          userAddress as `0x${string}`,
          BACKPACK_GUARDIAN_ADDRESS as `0x${string}`,
          BigInt(threshold)
        );

        const userOp = await safeAccountHelper.createSponsoredUserOp([revokeGuardianTx]);
        const userOpHash = safeAccountHelper.getUserOpHash(userOp);
        const signature = await webauthn.signMessage(userOpHash);
        await safeAccountHelper.signAndSendUserOp(userOp, signature);
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

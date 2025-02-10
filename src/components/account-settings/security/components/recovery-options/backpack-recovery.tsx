"use client";

import { useState } from "react";
import { Card } from "@nextui-org/card";
import { Switch } from "@nextui-org/switch";

import { socialRecovery } from "@/utils/safeAccount/socialRecovery";
import { useAccounts } from "@/contexts/AccountContext";
import { WebAuthnHelper } from "@/utils/webauthn";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";
import { Address } from "viem";
import { LocalStorage } from "@/utils/localstorage";
import { WebAuthnSafeAccountHelper } from "@/utils/safeAccount";

type BackpackRecoveryProps = {
  isEnabled: boolean;
  onToggle: () => Promise<void>;
};

export const BackpackRecovery = ({ isEnabled, onToggle }: BackpackRecoveryProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAccounts();

  const handleToggle = async () => {
    if (isLoading || !user) return;
    setIsLoading(true);

    try {
      const safeUser = LocalStorage.getSafeUser();
      const webauthn = new WebAuthnHelper({
        publicKey: safeUser?.publicKey,
        credentialId: safeUser?.passkeyId,
      });
      const userWalletAddress = user.walletAddress as Address;
      const safeAccountHelper = new WebAuthnSafeAccountHelper(safeUser?.publicKeyCoordinates);

      if (!isEnabled) {
        // Enable Backpack as guardian
        const enableModuleTx = socialRecovery.createEnableModuleTransaction(userWalletAddress);
        const addGuardianTx = socialRecovery.createAddGuardianTransaction(BACKPACK_GUARDIAN_ADDRESS, BigInt(2));

        const userOp = await safeAccountHelper.createSponsoredUserOp([enableModuleTx, addGuardianTx]);

        const userOpHash = safeAccountHelper.getUserOpHash(userOp);
        const signature = await webauthn.signMessage(userOpHash);

        return await safeAccountHelper.signAndSendUserOp(userOp, signature);
      } else {
        // Disable Backpack as guardian
        const revokeGuardianTx = await socialRecovery.createRevokeGuardianTransaction(
          userWalletAddress,
          BACKPACK_GUARDIAN_ADDRESS,
          BigInt(2)
        );

        const userOp = await safeAccountHelper.createSponsoredUserOp([revokeGuardianTx]);

        const userOpHash = safeAccountHelper.getUserOpHash(userOp);
        const signature = await webauthn.signMessage(userOpHash);

        return await safeAccountHelper.signAndSendUserOp(userOp, signature);
      }
    } catch (error) {
      console.error("Failed to toggle Backpack recovery:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Card className="space-y-4 p-4 bg-content2 border-divider">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground/60">
              Allow Backpack to help recover your account in case of emergency
            </p>
            <Switch
              classNames={{
                wrapper: isEnabled ? "bg-teal-500" : "",
              }}
              isDisabled={isLoading}
              isSelected={isEnabled}
              size="sm"
              onValueChange={handleToggle}
            />
          </div>
          <div className="text-xs text-foreground/50 space-y-2">
            <p>By enabling Backpack Recovery, you understand and agree that:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Backpack will act as a guardian for your account for recovery purposes only</li>
              <li>Recovery requires additional verification methods to be configured</li>
              <li>This adds an extra layer of security to prevent permanent lockout</li>
              <li>Recovery process includes a mandatory grace period</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

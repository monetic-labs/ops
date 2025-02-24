"use client";

import { useState } from "react";
import { Card } from "@nextui-org/card";
import { Switch } from "@nextui-org/switch";
import { Address } from "viem";

import {
  createRevokeGuardianTransaction,
  createAddGuardianTransaction,
  createEnableModuleTransaction,
} from "@/utils/socialRecovery";
import { useUser } from "@/contexts/UserContext";
import { WebAuthnHelper } from "@/utils/webauthn";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";
import { createAndSendSponsoredUserOp, sendUserOperation } from "@/utils/safe";

type BackpackRecoveryProps = {
  isEnabled: boolean;
  onToggle: () => Promise<void>;
};

export const BackpackRecovery = ({ isEnabled, onToggle }: BackpackRecoveryProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, credentials } = useUser();

  const handleToggle = async () => {
    if (isLoading || !user || !credentials) return;
    setIsLoading(true);

    try {
      const webauthn = new WebAuthnHelper({
        publicKey: credentials.publicKey,
        credentialId: credentials.credentialId,
      });
      const walletAddress = user.walletAddress as Address;
      const signer = credentials.publicKey;

      if (!isEnabled) {
        // Enable Backpack as guardian
        const enableModuleTx = createEnableModuleTransaction(walletAddress);
        const addGuardianTx = createAddGuardianTransaction(BACKPACK_GUARDIAN_ADDRESS, BigInt(2));

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

        await onToggle();
      } else {
        // Disable Backpack as guardian
        const revokeGuardianTx = await createRevokeGuardianTransaction(
          walletAddress,
          BACKPACK_GUARDIAN_ADDRESS,
          BigInt(2)
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

        await onToggle();
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

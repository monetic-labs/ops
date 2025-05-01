import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { User as HeroUser } from "@heroui/user";
import { TriangleAlert } from "lucide-react";
import { Address } from "viem";
import { SafeAccountV0_3_0 as SafeAccount, MetaTransaction } from "abstractionkit";

import { Account, Signer } from "@/types/account";
import { useUser } from "@/contexts/UserContext";
import { executeNestedTransaction } from "@/utils/safe/flows/nested";
import { createRemoveOwnerTemplate } from "@/utils/safe/templates";
import { getSafeThreshold } from "@/utils/safe/core/account";
import { TransferStatus, TransferStatusOverlay } from "@/components/generics/transfer-status";
import { useToast } from "@/hooks/generics/useToast";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";
import { getOpepenAvatar } from "@/utils/helpers";

interface RemoveSignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  signerToRemove: Signer;
  onSuccess?: () => void;
}

export function RemoveSignerModal({ isOpen, onClose, account, signerToRemove, onSuccess }: RemoveSignerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<TransferStatus>(TransferStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user } = useUser();
  const { toast } = useToast();
  const { selectCredential } = usePasskeySelection();

  const handleReset = () => {
    setStatus(TransferStatus.IDLE);
    setErrorMessage(null);
    if (status === TransferStatus.SENT || status === TransferStatus.ERROR) {
      // Reset specific state if needed on final close
    }
    if (status === TransferStatus.SENT) {
      onSuccess?.();
      onClose(); // Close modal on successful reset
    }
  };

  const handleRemoveSigner = async () => {
    if (!signerToRemove) return;

    // Ensure we don't remove the last signer (redundant check, but safe)
    if (account.signers.length <= 1) {
      toast({ title: "Error", description: "Cannot remove the last signer.", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      setStatus(TransferStatus.PREPARING);
      setErrorMessage(null);

      // 1. Fetch Current Threshold
      let currentThreshold = 1;
      try {
        currentThreshold = await getSafeThreshold(account.address as Address);
      } catch (thresholdError) {
        console.error("Failed to fetch current threshold:", thresholdError);
        toast({ title: "Error", description: "Could not fetch current account threshold.", variant: "destructive" });
        setStatus(TransferStatus.ERROR);
        setErrorMessage("Failed to fetch current account threshold.");
        setIsLoading(false);
        return;
      }

      // 2. Calculate New Threshold (Simple approach for now)
      const newOwnerCount = account.signers.length - 1;
      const newThreshold = Math.max(1, Math.min(currentThreshold, newOwnerCount));
      console.log(
        `Removing signer. Current Threshold: ${currentThreshold}, New Threshold: ${newThreshold}, New Owner Count: ${newOwnerCount}`
      );

      // 3. Get Previous Owner for removeOwner call (use sentinel 0x...1)
      // The SDK/template handles finding the actual previous owner if needed.
      const sentinelPrevOwner = "0x0000000000000000000000000000000000000001" as Address;

      // 4. Create Remove Owner Transaction
      const safeAccount = new SafeAccount(account.address);
      const removeOwnerTxs = await createRemoveOwnerTemplate(
        safeAccount,
        sentinelPrevOwner, // Sentinel Previous Owner
        signerToRemove.address as Address,
        newThreshold
      );

      // 5. Select Signing Credential
      const selectedCredential = await selectCredential();

      // 6. Execute Nested Transaction
      await executeNestedTransaction({
        fromSafeAddress: user?.walletAddress as Address,
        throughSafeAddress: account.address as Address,
        transactions: removeOwnerTxs,
        credentials: selectedCredential,
        callbacks: {
          onPreparing: () => setStatus(TransferStatus.PREPARING),
          onSigning: () => setStatus(TransferStatus.SIGNING),
          onSigningComplete: () => setStatus(TransferStatus.SENDING),
          onSent: () => setStatus(TransferStatus.CONFIRMING),
          onSuccess: () => {
            setStatus(TransferStatus.SENT);
            toast({ title: "Success", description: "Signer removed successfully." });
            // onSuccess prop handles refresh and modal close via handleReset
          },
          onError: (error) => {
            console.error("Error removing signer:", error);
            setStatus(TransferStatus.ERROR);
            const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
            setErrorMessage(errorMsg);
            toast({ title: "Error removing signer", description: errorMsg, variant: "destructive" });
          },
        },
      });
    } catch (error: any) {
      console.error("Error in remove signer process:", error);
      setStatus(TransferStatus.ERROR);
      const errorMsg = error instanceof Error ? error.message : error.message || "Unknown error occurred.";
      setErrorMessage(errorMsg);
      toast({ title: "Error removing signer", description: errorMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Details for status overlay
  const SignerRemovalDetails = () => (
    <div className="text-sm text-center p-2 space-y-1">
      <p className="font-medium">Removing signer from {account.name} account</p>
      <p className="text-default-500">Signer: {signerToRemove.name}</p>
      {errorMessage && <p className="text-danger mt-2 text-xs">{errorMessage}</p>}
    </div>
  );

  // Render Status Overlay if transaction is active
  if (status !== TransferStatus.IDLE) {
    return (
      <Modal
        isOpen={isOpen}
        size="lg"
        onClose={() => {
          if (status === TransferStatus.SENT || status === TransferStatus.ERROR) {
            handleReset();
            onClose();
          }
        }}
      >
        <ModalContent>
          <TransferStatusOverlay
            autoResetDelay={5000}
            status={status}
            transferDetails={<SignerRemovalDetails />}
            onComplete={() => {
              onSuccess?.();
              onClose();
            }}
            onReset={handleReset}
          />
        </ModalContent>
      </Modal>
    );
  }

  // Render Confirmation Modal (Polished)
  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="justify-center">
              <div className="flex items-center justify-center gap-2 text-foreground">
                <TriangleAlert className="w-5 h-5 text-warning flex-shrink-0" />
                <p>Are you sure you want to remove?</p>
              </div>
            </ModalHeader>
            <ModalBody className="flex flex-col items-center text-center gap-4 pt-2 pb-6">
              <div className="my-4 scale-110">
                <HeroUser
                  avatarProps={{
                    radius: "lg",
                    size: "md",
                    src: getOpepenAvatar(signerToRemove.name, 40),
                  }}
                  classNames={{
                    name: "text-lg font-semibold",
                    description: "text-sm text-foreground-500",
                  }}
                  description={signerToRemove.role}
                  name={signerToRemove.name}
                />
              </div>
              <p className="text-sm text-foreground-500/90 max-w-xs">
                This requires an on-chain transaction initiated by your primary account ({user?.firstName}{" "}
                {user?.lastName}).
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose} isDisabled={isLoading}>
                Cancel
              </Button>
              <Button color="danger" isLoading={isLoading} onPress={handleRemoveSigner}>
                Confirm Removal
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

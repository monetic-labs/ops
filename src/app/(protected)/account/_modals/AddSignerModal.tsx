import { useState, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { User as HeroUser } from "@heroui/user";
import { TriangleAlert } from "lucide-react";
import { Address } from "viem";
import { SafeAccountV0_3_0 as SafeAccount, MetaTransaction } from "abstractionkit";
import { type Selection } from "@react-types/shared";

import { useUsers } from "@/contexts/UsersContext";
import { useSigners } from "@/contexts/SignersContext";
import { getOpepenAvatar } from "@/utils/helpers";
import { Account } from "@/types/account";
import { useUser } from "@/contexts/UserContext";
import { executeNestedTransaction } from "@/utils/safe/flows/nested";
import { createAddOwnerTemplate } from "@/utils/safe/templates";
import { TransferStatus, TransferStatusOverlay } from "@/components/generics/transfer-status";
import { useToast } from "@/hooks/generics/useToast";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";
import { getSafeThreshold } from "@/utils/safe/core/account";

interface AddSignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onSuccess?: () => void;
}

export function AddSignerModal({ isOpen, onClose, account, onSuccess }: AddSignerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserKeys, setSelectedUserKeys] = useState<Selection>(new Set());
  const [status, setStatus] = useState<TransferStatus>(TransferStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { users } = useUsers();
  const { getAvailableSigners } = useSigners();
  const { user, getCredentials } = useUser();
  const { toast } = useToast();
  const { selectCredential } = usePasskeySelection();

  const availableUsers = users.filter(
    (user) =>
      user.walletAddress &&
      !account.signers.some((signer) => signer.address.toLowerCase() === user.walletAddress?.toLowerCase())
  );

  const selectedUserDetails = useMemo(() => {
    if (selectedUserKeys === "all") {
      return availableUsers;
    }
    return Array.from(selectedUserKeys)
      .map((key) => availableUsers.find((u) => u.walletAddress === key))
      .filter((u): u is NonNullable<typeof u> => u !== undefined);
  }, [selectedUserKeys, availableUsers]);

  const handleReset = () => {
    setStatus(TransferStatus.IDLE);
    setErrorMessage(null);
    setSelectedUserKeys(new Set());

    if (status === TransferStatus.SENT) {
      onSuccess?.();
      onClose();
    }
  };

  const handleAddSigner = async () => {
    const keysToProcess =
      selectedUserKeys === "all"
        ? availableUsers.map((u) => u.walletAddress as Address)
        : Array.from(selectedUserKeys as Set<string>).map((k) => k as Address);

    if (keysToProcess.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one user to add as signer",
        variant: "destructive",
      });
      return;
    }

    const credentials = getCredentials();
    if (!credentials || credentials.length === 0) {
      toast({
        title: "Authentication Error",
        description: "No passkey found. Please ensure you have a registered passkey.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setStatus(TransferStatus.PREPARING);
      setErrorMessage(null);

      let currentThreshold = 1;
      try {
        currentThreshold = await getSafeThreshold(account.address as Address);
        console.log("Current threshold fetched:", currentThreshold);
      } catch (thresholdError) {
        console.error("Failed to fetch current threshold:", thresholdError);
        toast({ title: "Error", description: "Could not fetch current account threshold.", variant: "destructive" });
        setStatus(TransferStatus.ERROR);
        setErrorMessage("Failed to fetch current account threshold.");
        setIsLoading(false);
        return;
      }

      const safeAccount = new SafeAccount(account.address);
      const batchTransactions: MetaTransaction[] = [];

      for (const userAddress of keysToProcess) {
        const addOwnerTxs = await createAddOwnerTemplate(safeAccount, userAddress, currentThreshold);
        batchTransactions.push(...addOwnerTxs);
      }

      let selectedCredential;
      try {
        selectedCredential = await selectCredential();
      } catch (error) {
        console.error("Credential selection failed:", error);
        throw new Error("Passkey selection failed. Please try again.");
      }

      await executeNestedTransaction({
        fromSafeAddress: user?.walletAddress as Address,
        throughSafeAddress: account.address as Address,
        transactions: batchTransactions,
        credentials: selectedCredential,
        callbacks: {
          onPreparing: () => setStatus(TransferStatus.PREPARING),
          onSigning: () => setStatus(TransferStatus.SIGNING),
          onSigningComplete: () => setStatus(TransferStatus.SENDING),
          onSent: () => setStatus(TransferStatus.CONFIRMING),
          onSuccess: () => {
            setStatus(TransferStatus.SENT);
            toast({
              title: "Success",
              description: `Successfully added ${keysToProcess.length} signer(s).`,
            });
          },
          onError: (error) => {
            console.error("Error adding signers:", error);
            setStatus(TransferStatus.ERROR);
            const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
            setErrorMessage(errorMsg);
            toast({
              title: "Error adding signers",
              description: errorMsg,
              variant: "destructive",
            });
          },
        },
      });
    } catch (error) {
      console.error("Error in add signers process:", error);
      setStatus(TransferStatus.ERROR);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(errorMsg);
      toast({
        title: "Error adding signers",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const SignerDetails = () => (
    <div className="text-sm text-center p-2 space-y-1">
      <p className="font-medium">
        Adding {selectedUserDetails.length} signer(s) to {account.name}
      </p>
      <div className="text-default-500 text-xs max-h-20 overflow-y-auto">
        {selectedUserDetails.map((u) => (
          <p key={u.id}>
            {u.firstName} {u.lastName}
          </p>
        ))}
      </div>
      {errorMessage && <p className="text-danger mt-2 text-xs">{errorMessage}</p>}
    </div>
  );

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
            transferDetails={<SignerDetails />}
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

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader>Add Signer(s)</ModalHeader>
            <ModalBody className="gap-4">
              {availableUsers.length === 0 && !isLoading && (
                <div className="flex items-start gap-3 p-3 text-sm text-warning-700 bg-warning-50 border border-warning-200 rounded-lg">
                  <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">No Eligible Users Found</p>
                    <p className="mt-1">
                      To add a signer, ensure the user is registered in your organization, has an associated wallet
                      address, and is not already a signer on this account.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Select
                    isDisabled={isLoading || availableUsers.length === 0}
                    label="Select Signer(s)"
                    placeholder={
                      isLoading
                        ? "Loading users..."
                        : availableUsers.length === 0
                          ? "No eligible users found"
                          : "Select a user"
                    }
                    selectionMode="multiple"
                    selectedKeys={selectedUserKeys}
                    onSelectionChange={setSelectedUserKeys}
                  >
                    {availableUsers.map((user) => (
                      <SelectItem key={user.walletAddress} textValue={`${user.firstName} ${user.lastName}`}>
                        <HeroUser
                          avatarProps={{
                            radius: "lg",
                            src: getOpepenAvatar(`${user.firstName} ${user.lastName}`, 32),
                          }}
                          description={user.role}
                          name={`${user.firstName} ${user.lastName}`}
                        />
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                isDisabled={
                  isLoading ||
                  availableUsers.length === 0 ||
                  (selectedUserKeys !== "all" && selectedUserKeys.size === 0)
                }
                isLoading={isLoading}
                onPress={handleAddSigner}
              >
                Add Signer(s)
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import { User } from "@nextui-org/user";
import { Address } from "viem";
import { SafeAccountV0_3_0 as SafeAccount } from "abstractionkit";

import { useUsers } from "@/contexts/UsersContext";
import { useSigners } from "@/contexts/SignersContext";
import { getOpepenAvatar } from "@/utils/helpers";
import { Account } from "@/types/account";
import { useUser } from "@/contexts/UserContext";
import { executeNestedTransaction } from "@/utils/safe/flows/nested";
import { createAddOwnerTemplate } from "@/utils/safe/templates";
import { TransferStatus, TransferStatusOverlay } from "@/components/generics/transfer-status";
import { useToast } from "@/hooks/useToast";

interface AddSignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onSuccess?: () => void;
}

export function AddSignerModal({ isOpen, onClose, account, onSuccess }: AddSignerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [status, setStatus] = useState<TransferStatus>(TransferStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { users } = useUsers();
  const { getAvailableSigners } = useSigners();
  const { user, getSigningCredentials } = useUser();
  const { toast } = useToast();

  // Filter users who have wallet addresses and aren't already signers
  const availableUsers = users.filter(
    (user) =>
      user.walletAddress &&
      !account.signers.some((signer) => signer.address.toLowerCase() === user.walletAddress?.toLowerCase())
  );

  const handleReset = () => {
    setStatus(TransferStatus.IDLE);
    setErrorMessage(null);

    if (status === TransferStatus.SENT) {
      onSuccess?.();
      onClose();
    }
  };

  const handleAddSigner = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user to add as signer",
        variant: "destructive",
      });

      return;
    }

    // Get the credentials from the context
    const credentials = getSigningCredentials();

    if (!credentials) {
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

      // Create the add owner transaction template
      const safeAccount = new SafeAccount(account.address);
      const addOwnerTxs = await createAddOwnerTemplate(safeAccount, selectedUser as Address);

      // Execute the nested transaction with proper status tracking
      await executeNestedTransaction({
        fromSafeAddress: user?.walletAddress as Address,
        throughSafeAddress: account.address as Address,
        transactions: addOwnerTxs,
        credentials,
        callbacks: {
          onPreparing: () => {
            setStatus(TransferStatus.PREPARING);
          },
          onSigning: () => {
            setStatus(TransferStatus.SIGNING);
          },
          onSigningComplete: () => {
            setStatus(TransferStatus.SENDING);
          },
          onSent: () => {
            setStatus(TransferStatus.CONFIRMING);
          },
          onSuccess: () => {
            setStatus(TransferStatus.SENT);
            toast({
              title: "Success",
              description: "Signer added successfully",
            });
          },
          onError: (error) => {
            console.error("Error adding signer:", error);
            setStatus(TransferStatus.ERROR);
            const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";

            setErrorMessage(errorMsg);
            toast({
              title: "Error adding signer",
              description: errorMsg,
              variant: "destructive",
            });
          },
        },
      });
    } catch (error) {
      console.error("Error in add signer process:", error);
      setStatus(TransferStatus.ERROR);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";

      setErrorMessage(errorMsg);
      toast({
        title: "Error adding signer",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simple component to show in the transfer details
  const SignerDetails = () => (
    <div className="text-sm text-center p-2">
      <p className="font-medium">Adding signer to {account.name}</p>
      {selectedUser && (
        <p className="text-default-500">
          New signer: {users.find((u) => u.walletAddress === selectedUser)?.firstName}{" "}
          {users.find((u) => u.walletAddress === selectedUser)?.lastName}
        </p>
      )}
      {errorMessage && <p className="text-danger mt-2">{errorMessage}</p>}
    </div>
  );

  // If we have an active transaction, show the status overlay
  if (status !== TransferStatus.IDLE) {
    return (
      <Modal
        isOpen={isOpen}
        size="lg"
        onClose={() => {
          // Only allow closing if we're in a final state
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
            <ModalHeader>Add Signer</ModalHeader>
            <ModalBody className="gap-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Select User</h4>
                  <Select
                    isDisabled={isLoading || availableUsers.length === 0}
                    label="Add Signer"
                    placeholder={availableUsers.length === 0 ? "No available users" : "Select a user"}
                    selectedKeys={selectedUser ? [selectedUser] : []}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    {availableUsers.map((user) => (
                      <SelectItem key={user.walletAddress} textValue={`${user.firstName} ${user.lastName}`}>
                        <User
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
                isDisabled={!selectedUser || isLoading}
                isLoading={isLoading}
                onPress={handleAddSigner}
              >
                Add Signer
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

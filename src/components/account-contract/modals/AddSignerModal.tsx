import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import { User } from "@nextui-org/user";
import { Address } from "viem";
import { SafeAccountV0_3_0 as SafeAccount, DEFAULT_SECP256R1_PRECOMPILE_ADDRESS } from "abstractionkit";

import { useUsers } from "@/contexts/UsersContext";
import { useSigners } from "@/contexts/SignersContext";
import { getOpepenAvatar } from "@/utils/helpers";
import { Account } from "@/types/account";
import { useUser } from "@/contexts/UserContext";
import { executeNestedTransaction } from "@/utils/safe/transaction";
import { createAddOwnerTemplate } from "@/utils/safe/templates";
interface AddSignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onSuccess?: () => void;
}

export function AddSignerModal({ isOpen, onClose, account, onSuccess }: AddSignerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const { users } = useUsers();
  const { getAvailableSigners } = useSigners();
  const { user } = useUser();

  // Filter users who have wallet addresses and aren't already signers
  const availableUsers = users.filter(
    (user) =>
      user.walletAddress &&
      !account.signers.some((signer) => signer.address.toLowerCase() === user.walletAddress?.toLowerCase())
  );

  const handleAddSigner = async () => {
    if (!selectedUser || !user?.registeredPasskeys?.[0]) return;

    try {
      setIsLoading(true);

      // Create the add owner transaction template
      const safeAccount = new SafeAccount(account.address);
      const addOwnerTxs = await createAddOwnerTemplate(safeAccount, selectedUser as Address);

      // Execute the nested transaction
      await executeNestedTransaction({
        fromSafeAddress: user.walletAddress as Address,
        throughSafeAddress: account.address as Address,
        transactions: addOwnerTxs,
        credentials: {
          credentialId: user.registeredPasskeys[0].credentialId,
          publicKey: {
            x: BigInt("0x" + user.registeredPasskeys[0].publicKey.slice(0, 64)),
            y: BigInt("0x" + user.registeredPasskeys[0].publicKey.slice(64)),
          },
        },
        callbacks: {
          onSuccess: () => {
            onSuccess?.();
            onClose();
          },
          onError: (error) => {
            console.error("Error adding signer:", error);
          },
        },
      });
    } catch (error) {
      console.error("Error in add signer process:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

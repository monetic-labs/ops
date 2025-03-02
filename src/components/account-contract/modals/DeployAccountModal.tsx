import type { Account, Signer } from "@/types/account";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { Trash2 } from "lucide-react";

import { useSigners } from "@/contexts/SignersContext";
import { getOpepenAvatar } from "@/utils/helpers";

interface DeployAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: () => void;
  accounts: Account[];
  selectedAccount: Account;
  selectedSigners: Signer[];
  setSelectedSigners: (signers: Signer[]) => void;
  threshold: number;
  setThreshold: (threshold: number) => void;
}

export function DeployAccountModal({
  isOpen,
  onClose,
  onDeploy,
  accounts,
  selectedAccount,
  selectedSigners,
  setSelectedSigners,
  threshold,
  setThreshold,
}: DeployAccountModalProps) {
  const { getAvailableSigners, isLoading } = useSigners();

  const availableSigners = getAvailableSigners(selectedSigners.map((s) => s.address));

  const handleAddSigner = (signerId: string) => {
    const signer = availableSigners.find((s) => s.address === signerId);
    if (signer) {
      setSelectedSigners([...selectedSigners, signer]);
    }
  };

  const handleRemoveSigner = (signerId: string) => {
    setSelectedSigners(selectedSigners.filter((s) => s.address !== signerId));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        {() => (
          <>
            <ModalHeader>Deploy Account</ModalHeader>
            <ModalBody className="gap-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Selected Account</h4>
                  <div className="flex items-center gap-2 p-3 bg-content2 rounded-lg">
                    <selectedAccount.icon className="w-5 h-5 text-foreground/60" />
                    <span>{selectedAccount.name}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Signers</h4>
                  <div className="space-y-2">
                    {selectedSigners.map((signer) => (
                      <div
                        key={signer.address}
                        className="flex items-center justify-between p-3 bg-content2 rounded-lg"
                      >
                        <User
                          avatarProps={{
                            radius: "lg",
                            src: getOpepenAvatar(signer.name, 32),
                          }}
                          description={signer.role}
                          name={signer.name}
                        />
                        <Button
                          isIconOnly
                          className="text-danger"
                          size="sm"
                          variant="light"
                          onPress={() => handleRemoveSigner(signer.address)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}

                    <Select
                      isDisabled={isLoading || availableSigners.length === 0}
                      label="Add Signer"
                      placeholder={isLoading ? "Loading signers..." : "Select a signer"}
                      selectedKeys={[]}
                      onChange={(e) => handleAddSigner(e.target.value)}
                    >
                      {availableSigners.map((signer) => (
                        <SelectItem key={signer.address} textValue={signer.name}>
                          <User
                            avatarProps={{
                              radius: "lg",
                              src: getOpepenAvatar(signer.name, 32),
                            }}
                            description={signer.role}
                            name={signer.name}
                          />
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Threshold</h4>
                  <div className="flex items-center gap-2">
                    <Select
                      isDisabled={selectedSigners.length === 0}
                      label="Required Signatures"
                      placeholder="Select threshold"
                      selectedKeys={[threshold.toString()]}
                      onChange={(e) => setThreshold(parseInt(e.target.value))}
                    >
                      {Array.from({ length: selectedSigners.length }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num}>
                          {num} {num === 1 ? "signature" : "signatures"}
                        </SelectItem>
                      ))}
                    </Select>
                    <div className="flex-1">
                      <Chip className="bg-content2" size="sm">
                        {threshold} out of {selectedSigners.length} signatures required
                      </Chip>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                isDisabled={selectedSigners.length === 0}
                onPress={() => {
                  onDeploy();
                  onClose();
                }}
              >
                Deploy Account
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

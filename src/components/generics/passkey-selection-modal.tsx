import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { KeyRound } from "lucide-react";
import { Radio, RadioGroup } from "@heroui/radio";
import { Button } from "@heroui/button";

import { WebAuthnCredentials } from "@/types/webauthn";
import { useUser } from "@/contexts/UserContext";
import { usePasskeySelectionModal } from "@/contexts/PasskeySelectionContext";

/**
 * A modal for selecting which passkey to use for signing transactions
 * Used when a user logs in with email and has multiple passkeys registered
 */
export const PasskeySelectionModal: React.FC = () => {
  const { getCredentials } = useUser();
  const credentials = getCredentials() || [];
  const { isOpen, onOpenChange, onSelect, onCancel } = usePasskeySelectionModal();
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | undefined>(
    credentials.length > 0 ? credentials[0].credentialId : undefined
  );

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen && credentials.length > 0) {
      setSelectedCredentialId(credentials[0].credentialId);
    }
  }, [isOpen, credentials]);

  // Format credential ID for display (first 6 and last 4 characters)
  const formatCredentialId = (id: string) => {
    if (id.length <= 10) return id;
    return `${id.substring(0, 6)}...${id.substring(id.length - 4)}`;
  };

  // Handle selection confirmation
  const handleConfirm = () => {
    if (!selectedCredentialId) return;

    const selectedCredential = credentials.find((cred) => cred.credentialId === selectedCredentialId);
    if (selectedCredential) {
      onSelect(selectedCredential);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={() => onCancel()}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Select a Passkey</ModalHeader>
            <ModalBody>
              {credentials.length === 0 ? (
                <div className="text-center py-4">
                  <div className="flex justify-center mb-4">
                    <KeyRound className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600">
                    You don&apos;t have any passkeys registered. Please register a passkey in your account settings to
                    continue.
                  </p>
                </div>
              ) : (
                <RadioGroup
                  value={selectedCredentialId}
                  onValueChange={setSelectedCredentialId}
                  label="Select a passkey to use for signing"
                >
                  {credentials.map((credential) => (
                    <Radio key={credential.credentialId} value={credential.credentialId}>
                      Passkey {formatCredentialId(credential.credentialId)}
                    </Radio>
                  ))}
                </RadioGroup>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="flat"
                onPress={() => {
                  onCancel();
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  handleConfirm();
                  onClose();
                }}
                isDisabled={!selectedCredentialId || credentials.length === 0}
              >
                Confirm
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

// Re-export the hook for convenience
export { usePasskeySelection } from "@/contexts/PasskeySelectionContext";

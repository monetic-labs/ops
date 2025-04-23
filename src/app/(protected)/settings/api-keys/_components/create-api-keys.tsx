import { useState, useEffect } from "react";
import { Modal, ModalBody, ModalHeader, ModalContent } from "@heroui/modal";
import { Button } from "@heroui/button";
import { TableColumn, TableCell, Table, TableBody, TableHeader, TableRow } from "@heroui/table";
import { Input } from "@heroui/input";
import { Snippet } from "@heroui/snippet";

import { useApiService } from "@/hooks/widgets/useApiService";
import ModalFooterWithSupport from "@/components/generics/footer-modal-support";

interface GenerateApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateApiKeysModal({ isOpen, onClose }: GenerateApiKeysModalProps) {
  const { apiKeys, isLoading, error, loadApiKeys, generateApiKey, deleteApiKey } = useApiService();
  const [newKeyName, setNewKeyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
    }
  }, [isOpen, loadApiKeys]);

  const handleGenerateKey = async () => {
    if (!newKeyName) return;
    setIsGenerating(true);
    await generateApiKey(newKeyName);
    setNewKeyName("");
    setIsGenerating(false);
  };

  const handleDeleteKey = async (id: string) => {
    await deleteApiKey(id);
  };

  const handleSupportClick = () => {
    console.log("Support clicked");
  };

  const footerActions = [
    {
      label: "Generate Key",
      onClick: handleGenerateKey,
      isLoading: isGenerating,
    },
  ];

  const truncateKey = (key: string): string => {
    if (key.length <= 10) return key;

    return `${key.slice(0, 5)}....${key.slice(-4)}`;
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">API Keys</ModalHeader>
        <ModalBody>
          {error && <p className="text-red-500">{error}</p>}
          {isLoading ? (
            <p>Loading API keys...</p>
          ) : (
            <Table removeWrapper aria-label="API Keys">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>KEY</TableColumn>
                <TableColumn>CREATED</TableColumn>
                <TableColumn>LAST USED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key, index) => (
                  <TableRow key={index}>
                    <TableCell>{key.name}</TableCell>
                    <TableCell>
                      <Snippet codeString={key.key}>{truncateKey(key.key)}</Snippet>
                    </TableCell>
                    <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}</TableCell>
                    <TableCell>
                      <Button color="primary" size="sm" onClick={() => handleDeleteKey(key.key)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex gap-2 mb-4">
            <Input placeholder="Enter key name" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
          </div>
        </ModalBody>
        <ModalFooterWithSupport actions={footerActions} onSupportClick={handleSupportClick} />
      </ModalContent>
    </Modal>
  );
}

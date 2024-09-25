import { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalContent } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { TableColumn, TableCell, Table, TableBody, TableHeader, TableRow } from "@nextui-org/table";
import { useApiService } from '@/hooks/widgets/useApiService';
import { Input } from '@nextui-org/input';
import ModalFooterWithSupport from '@/components/generics/footer-modal-support';
import { Chip } from '@nextui-org/chip';
import { FormButton } from '@/components/generics/form-button';

interface GenerateApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateApiKeysModal({ isOpen, onClose }: GenerateApiKeysModalProps) {
  const { apiKeys, isLoading, error, loadApiKeys, generateApiKey, deleteApiKey } = useApiService();
  const [newKeyName, setNewKeyName] = useState('');
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
    setNewKeyName('');
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">API Keys</ModalHeader>
        <ModalBody>
          {error && <p className="text-red-500">{error}</p>}
          {isLoading ? (
            <p>Loading API keys...</p>
          ) : (
            <Table aria-label="API Keys">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>KEY</TableColumn>
                <TableColumn>CREATED</TableColumn>
                <TableColumn>LAST USED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>{key.name}</TableCell>
                    <TableCell>
                      <Chip>{key.key.substr(0, 8)}...</Chip>
                    </TableCell>
                    <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</TableCell>
                    <TableCell>
                      <Button color="primary" size="sm" onClick={() => handleDeleteKey(key.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter key name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
          </div>
        </ModalBody>
        <ModalFooterWithSupport
          onSupportClick={handleSupportClick}
          actions={footerActions}
        />
      </ModalContent>
    </Modal>
  );
}
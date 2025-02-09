import { Button } from "@nextui-org/button";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";
import { Account } from "@/contexts/AccountContext";

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSelect: (account: Account) => void;
  selectedAccountId?: string;
  title: string;
}

export function AccountSelectionModal({
  isOpen,
  onClose,
  accounts,
  onSelect,
  selectedAccountId,
  title,
}: AccountSelectionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody className="gap-3 p-6">
          {accounts.map((account) => (
            <Button
              key={account.id}
              className={`w-full justify-start h-auto p-4 bg-content2 hover:bg-content3 ${
                selectedAccountId === account.id ? "border-2 border-primary" : ""
              }`}
              onPress={() => onSelect(account)}
            >
              <div className="flex items-center gap-3">
                <account.icon className="w-5 h-5 text-foreground/60" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{account.name}</span>
                  <span className="text-sm text-foreground/60">${account.balance?.toLocaleString()}</span>
                </div>
              </div>
            </Button>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

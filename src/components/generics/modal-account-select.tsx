import { Modal, ModalBody, ModalContent } from "@nextui-org/modal";

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
    <Modal
      classNames={{
        base: "bg-[#0A0A0A]",
        wrapper: "bg-black/80",
      }}
      isOpen={isOpen}
      size="sm"
      onClose={onClose}
    >
      <ModalContent>
        <ModalBody className="p-4">
          <h3 className="text-xl font-normal text-white mb-4">{title}</h3>
          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                className={`w-full p-4 rounded-xl border ${
                  selectedAccountId === account.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-[#1a1a1a] hover:border-[#2a2a2a] bg-[#141414]"
                } transition-all duration-200`}
                onClick={() => {
                  onSelect(account);
                  onClose();
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{account.name}</span>
                  {account.balance !== undefined && (
                    <span className="text-gray-400">${account.balance.toLocaleString()}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

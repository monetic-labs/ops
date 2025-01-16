import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";

import { BalanceDisplay } from "@/components/generics/balance-display";

interface Account {
  id: string;
  name: string;
  currency: string;
  balance?: number;
}

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSelect: (account: Account) => void;
  selectedAccountId?: string;
  title: string;
}

export default function AccountSelectionModal({
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
        body: "p-0",
      }}
      isOpen={isOpen}
      size="sm"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="px-5 py-4 text-xl font-normal text-white border-b border-[#1a1a1a]">
          {title}
        </ModalHeader>
        <ModalBody className="px-4 py-4">
          <div className="space-y-2">
            {accounts.map((account) => (
              <Button
                key={account.id}
                className={`w-full h-16 p-3 justify-between items-center border transition-all duration-200 ${
                  selectedAccountId === account.id
                    ? "bg-[#1a1a1a] border-[#2a2a2a]"
                    : "bg-[#141414] border-[#1a1a1a] hover:border-[#2a2a2a] hover:bg-[#181818]"
                }`}
                onClick={() => {
                  onSelect(account);
                  onClose();
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="text-white text-base font-medium">{account.name}</span>
                  <BalanceDisplay balance={account.balance || 0} className="text-gray-400" prefix="" />
                </div>
              </Button>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

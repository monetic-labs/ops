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
        base: "bg-background dark:bg-content1",
        backdrop: "bg-black/10 dark:bg-black/80",
        body: "p-0",
      }}
      isOpen={isOpen}
      size="sm"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="px-5 py-4 text-xl font-normal text-foreground border-b border-divider">
          {title}
        </ModalHeader>
        <ModalBody className="px-4 py-4">
          <div className="space-y-2">
            {accounts.map((account) => (
              <Button
                key={account.id}
                className={`w-full h-16 p-3 justify-between items-center border cursor-pointer transition-all duration-200 ${
                  selectedAccountId === account.id
                    ? "bg-content2 dark:bg-content3 border-divider"
                    : "bg-background/40 dark:bg-content2 border-divider/60 hover:border-divider hover:bg-content2 dark:hover:bg-content3"
                }`}
                onClick={() => {
                  onSelect(account);
                  onClose();
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="text-foreground text-base font-medium">{account.name}</span>
                  <BalanceDisplay balance={account.balance || 0} className="text-foreground/60" prefix="" />
                </div>
              </Button>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

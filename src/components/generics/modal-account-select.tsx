import type { Account } from "@/types/account";

import { Modal, ModalBody, ModalContent } from "@heroui/modal";

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
        base: "bg-background dark:bg-content1",
        backdrop: "bg-black/10 dark:bg-black/80",
        wrapper: "backdrop-blur-sm",
      }}
      isOpen={isOpen}
      size="sm"
      onClose={onClose}
    >
      <ModalContent>
        <ModalBody className="p-4">
          <h3 className="text-xl font-normal text-foreground mb-4">{title}</h3>
          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.address}
                className={`w-full p-4 rounded-xl border cursor-pointer ${
                  selectedAccountId === account.address
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-divider/60 dark:border-divider hover:border-divider bg-background/40 dark:bg-content2 hover:bg-content2 dark:hover:bg-content3"
                } transition-all duration-200`}
                onClick={() => {
                  onSelect(account);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <account.icon className="w-5 h-5 text-foreground/60" />
                    <span className="text-foreground font-medium">{account.name}</span>
                  </div>
                  {account.balance !== undefined && (
                    <span className="text-foreground/60">${account.balance.toLocaleString()}</span>
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

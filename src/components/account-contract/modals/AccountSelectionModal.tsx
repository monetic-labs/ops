import type { Account } from "@/types/account";

import { Button } from "@nextui-org/button";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";

import { useAccounts } from "@/contexts/AccountContext";
import { formatAmountUSD } from "@/utils/helpers";

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSelect: (account: Account) => void;
  selectedAccountId?: string;
  title: string;
  isSettlementSelection?: boolean;
}

export function AccountSelectionModal({
  isOpen,
  onClose,
  accounts,
  onSelect,
  selectedAccountId,
  title,
  isSettlementSelection = false,
}: AccountSelectionModalProps) {
  const { updateVirtualAccountDestination } = useAccounts();

  const handleSelect = async (account: Account) => {
    if (isSettlementSelection) {
      try {
        await updateVirtualAccountDestination(account.address);
      } catch (error) {
        console.error("Failed to update settlement account:", error);

        // TODO: Show error toast
        return;
      }
    }
    onSelect(account);
  };

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody className="gap-3 p-6">
          {accounts.map((account) => (
            <Button
              key={account.id}
              className={`w-full justify-start h-auto p-4 bg-content2 hover:bg-content3 ${
                selectedAccountId === account.id ? "border-2 border-primary" : ""
              }`}
              onPress={() => handleSelect(account)}
            >
              <div className="flex items-center gap-3">
                <account.icon className="w-5 h-5 text-foreground/60" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{account.name}</span>
                  <span className="text-sm text-foreground/60">{formatAmountUSD(account.balance ?? 0)}</span>
                </div>
              </div>
            </Button>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// REFAC THIS LATER

import { MerchantCardTransactionGetOutput } from "@monetic-labs/sdk";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: MerchantCardTransactionGetOutput["transactions"][number] & { avatar?: string };
}

export default function TransactionDetailsModal({ isOpen, onClose, transaction }: TransactionDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-success";
      case "PENDING":
        return "text-orange-500";
      case "FAILED":
        return "text-danger";
      default:
        return "text-foreground";
    }
  };

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Transaction Receipt</h2>
              <p className="text-sm text-foreground/60 truncate max-w-[200px] sm:max-w-[300px]">
                Transaction ID: {transaction.id}
              </p>
            </ModalHeader>
            <Divider />
            <ModalBody>
              <div className="space-y-4 font-mono">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="truncate max-w-[200px] sm:max-w-[300px] text-right">
                    {new Date(transaction.createdAt).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour12: true,
                      hour: "numeric",
                      minute: "numeric",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Spender:</span>
                  <span className="truncate max-w-[200px] sm:max-w-[300px] text-right">
                    {transaction.merchantCard.cardOwner.firstName + " " + transaction.merchantCard.cardOwner.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Card:</span>
                  <span className="truncate max-w-[200px] sm:max-w-[300px] text-right">
                    {transaction.merchantCard.displayName} (**** {transaction.merchantCard.lastFour})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="truncate max-w-[200px] sm:max-w-[300px] text-right">
                    {transaction.merchantCategory}
                  </span>
                </div>
                <Divider />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="truncate max-w-[200px] sm:max-w-[300px] text-right">
                    {(transaction.amount / 100).toPrecision(4)} {transaction.currency}
                  </span>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span
                    className={`truncate max-w-[200px] sm:max-w-[300px] text-right font-bold ${getStatusColor(transaction.status)}`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            </ModalBody>
            <Divider />
            <ModalFooter className="flex flex-col items-center">
              <p className="text-sm text-foreground/60 mb-2 truncate">Thank you for your business!</p>
              <Button className="bg-content2 text-foreground hover:bg-content3" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

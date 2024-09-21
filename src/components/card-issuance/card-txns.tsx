import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    amount: string;
    date: string;
    category: string;
    cardName: string;
    cardLastFour: string;
    spender: string;
    status: string;
    merchantId: string;
  };
}

export default function TransactionDetailsModal({ isOpen, onClose, transaction }: TransactionDetailsModalProps) {
  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Transaction Receipt</h2>
              <p className="text-sm text-gray-500">Merchant ID: {transaction.merchantId}</p>
            </ModalHeader>
            <Divider />
            <ModalBody>
              <div className="space-y-4 font-mono">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{transaction.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spender:</span>
                  <span>{transaction.spender}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card:</span>
                  <span>
                    {transaction.cardName} (**** {transaction.cardLastFour})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span>{transaction.category}</span>
                </div>
                <Divider />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>{transaction.amount}</span>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span
                    className={`font-bold ${
                      transaction.status === "Completed"
                        ? "text-ugh-400"
                        : transaction.status === "Pending"
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            </ModalBody>
            <Divider />
            <ModalFooter className="flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-2">Thank you for your business!</p>
              <Button onPress={onClose} className="bg-ualert-500">
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

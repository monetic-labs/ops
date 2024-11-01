import { Divider } from "@nextui-org/divider";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";

import { formattedDate } from "@/utils/helpers";

import ModalFooterWithSupport from "../generics/footer-modal-support";

interface TransactionReceiptModalProps {
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

export default function TransactionReceiptModal({ isOpen, onClose, transaction }: TransactionReceiptModalProps) {
  return (
    <Modal className="max-w-md mx-auto" isOpen={isOpen} scrollBehavior="inside" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Transaction Receipt</h2>
              <p className="text-sm text-gray-500">Merchant ID: {transaction.merchantId}</p>
            </ModalHeader>
            <Divider />
            <ModalBody>
              <div className="space-y-4 font-mono text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span>Date:</span>
                  <span className="text-right">{formattedDate(transaction.date)}</span>
                  <span>Spender:</span>
                  <span className="text-right">{transaction.spender}</span>
                  <span>Card:</span>
                  <span className="text-right">
                    {transaction.cardName} (**** {transaction.cardLastFour})
                  </span>
                  <span>Category:</span>
                  <span className="text-right">{transaction.category}</span>
                </div>
                <Divider />
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-bold">Total Amount:</span>
                  <span className="text-right font-bold">{transaction.amount}</span>
                </div>
                <Divider />
                <div className="grid grid-cols-2 gap-2">
                  <span>Status:</span>
                  <span
                    className={`text-right font-bold ${
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
            <ModalFooterWithSupport
              actions={[
                {
                  label: "Close",
                  onClick: onClose,
                  className: "bg-ualert-500 text-notpurple-500",
                },
              ]}
              onSupportClick={() => {}}
            />
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

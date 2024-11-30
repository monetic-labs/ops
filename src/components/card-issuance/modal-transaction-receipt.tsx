
import { MerchantCardTransactionGetOutput } from "@backpack-fux/pylon-sdk";
import { Divider } from "@nextui-org/divider";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";

import ModalFooterWithSupport from "../generics/footer-modal-support";

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: MerchantCardTransactionGetOutput["transactions"][number] & { avatar?: string };
}

export default function TransactionReceiptModal({ isOpen, onClose, transaction }: TransactionReceiptModalProps) {
  return (
    <Modal className="max-w-md mx-auto" isOpen={isOpen} scrollBehavior="inside" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Transaction Receipt</h2>
              <p className="text-sm text-gray-500">Transaction ID: {transaction.id}</p>
            </ModalHeader>
            <Divider />
            <ModalBody>
              <div className="space-y-4 font-mono text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span>Date:</span>
                  <span>
                    {" "}
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

                  <span>
                    {transaction.merchantCard.cardOwner.firstName + " " + transaction.merchantCard.cardOwner.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Card:</span>

                  <span>
                    {transaction.merchantCard.displayName} (**** {transaction.merchantCard.lastFour})
                  </span>
                  <span>Category:</span>
                  <span>{transaction.merchantCategory}</span>
                </div>
                <Divider />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>
                    {" "}
                    {(transaction.amount / 100).toPrecision(4)} {transaction.currency}
                  </span>
                </div>
                <Divider />
                <div className="grid grid-cols-2 gap-2">
                  <span>Status:</span>
                  <span
                    className={`font-bold ${
                      transaction.status === "COMPLETED"
                        ? "text-ugh-400"
                        : transaction.status === "PENDING"
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

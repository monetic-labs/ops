// REFAC THIS LATER

import { MerchantCardTransactionGetOutput } from "@backpack-fux/pylon-sdk";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Table, TableBody, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { PlusIcon } from "lucide-react";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: MerchantCardTransactionGetOutput["transactions"][number] & { avatar?: string };
}

export default function TransactionDetailsModal({ isOpen, onClose, transaction }: TransactionDetailsModalProps) {
  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Transaction Receipt</h2>
              <p className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-[300px]">
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
                    className={`truncate max-w-[200px] sm:max-w-[300px] text-right font-bold ${
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
            <ModalFooter className="flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-2 truncate">Thank you for your business!</p>
              <Button className="bg-ualert-500" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

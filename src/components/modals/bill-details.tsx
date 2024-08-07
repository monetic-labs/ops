import { BillPay } from "@/data";
import { Button } from "@nextui-org/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";

interface BillPayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  billPay: BillPay;
}

export default function BillPayDetailsModal({
  isOpen,
  onClose,
  billPay,
}: BillPayDetailsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader>Bill Pay Details for {billPay.vendor}</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
              <p>
                <strong>Payment Method:</strong> {billPay.paymentMethod}
              </p>
              <p>
                <strong>Amount:</strong> {billPay.amount.toLocaleString()}{" "}
                {billPay.currency}
              </p>
              <p>
                <strong>Transaction Cost:</strong>{" "}
                {billPay.transactionCost.toLocaleString()} {billPay.currency}
              </p>
              <p>
                <strong>Time to Settlement:</strong> {billPay.settlementTime}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Receiving Bank Details
              </h3>
              <p>
                <strong>Bank Name:</strong> {billPay.receivingBank.name}
              </p>
              <p>
                <strong>Routing Number:</strong>{" "}
                {billPay.receivingBank.routingNumber}
              </p>
              <p>
                <strong>Account Number:</strong>{" "}
                {billPay.receivingBank.accountNumber}
              </p>
              <p>
                <strong>Memo:</strong> {billPay.receivingBank.memo}
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

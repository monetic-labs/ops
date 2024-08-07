import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useState } from "react";

import { BillPay } from "@/data";

interface BillPayCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  billPay: BillPay;
  onSave: (clonedBillPay: BillPay) => void;
}

const paymentMethods = ["ACH", "Wire", "SWIFT", "SEPA", "Stable"];

export default function BillPayCloneModal({
  isOpen,
  onClose,
  billPay,
  onSave,
}: BillPayCloneModalProps) {
  const [clonedBillPay, setClonedBillPay] = useState<BillPay>({
    ...billPay,
    id: `clone-${Date.now()}`, // Generate a new id for the cloned bill pay
  });

  const handleSave = () => {
    onSave(clonedBillPay);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>Clone Bill Pay</ModalHeader>
        <ModalBody>
          <Input
            label="Vendor"
            value={clonedBillPay.vendor}
            onChange={(e) =>
              setClonedBillPay({ ...clonedBillPay, vendor: e.target.value })
            }
          />
          <Select
            label="Payment Method"
            selectedKeys={[clonedBillPay.paymentMethod]}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                paymentMethod: e.target.value as BillPay["paymentMethod"],
              })
            }>
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </Select>
          <Input
            label="Amount"
            type="number"
            value={clonedBillPay.amount.toString()}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                amount: e.target.value,
              })
            }
          />
          <Input
            label="Currency"
            value={clonedBillPay.currency}
            onChange={(e) =>
              setClonedBillPay({ ...clonedBillPay, currency: e.target.value })
            }
          />
          <Input
            label="Receiving Bank Name"
            value={clonedBillPay.receivingBank.name}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                receivingBank: {
                  ...clonedBillPay.receivingBank,
                  name: e.target.value,
                },
              })
            }
          />
          <Input
            label="Routing Number"
            value={clonedBillPay.receivingBank.routingNumber}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                receivingBank: {
                  ...clonedBillPay.receivingBank,
                  routingNumber: e.target.value,
                },
              })
            }
          />
          <Input
            label="Account Number"
            value={clonedBillPay.receivingBank.accountNumber}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                receivingBank: {
                  ...clonedBillPay.receivingBank,
                  accountNumber: e.target.value,
                },
              })
            }
          />
          <Input
            label="Memo"
            value={clonedBillPay.receivingBank.memo}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                receivingBank: {
                  ...clonedBillPay.receivingBank,
                  memo: e.target.value,
                },
              })
            }
          />
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSave}>
            Clone
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

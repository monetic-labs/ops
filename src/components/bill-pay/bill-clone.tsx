import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useState } from "react";
import { TransactionListItem } from "@backpack-fux/pylon-sdk";

interface BillPayCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  billPay: TransactionListItem;
  onSave: (clonedBillPay: TransactionListItem) => void;
}

const paymentMethods = ["CARD", "ACH", "WIRE", "CRYPTO"];

export default function BillPayCloneModal({ isOpen, onClose, billPay, onSave }: BillPayCloneModalProps) {
  const [clonedBillPay, setClonedBillPay] = useState<TransactionListItem>({
    ...billPay,
    id: billPay.id,
    status: "PENDING",
  });
  const handleSave = () => {
    onSave(clonedBillPay);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Clone Transaction</ModalHeader>
        <ModalBody>
          <Select
            label="Processor"
            selectedKeys={[clonedBillPay.processor]}
            onChange={(e) =>
              setClonedBillPay({ ...clonedBillPay, processor: e.target.value as TransactionListItem["processor"] })
            }
          >
            {["WORLDPAY", "STRIPE", "PAYPAL"].map((processor) => (
              <SelectItem key={processor} value={processor}>
                {processor}
              </SelectItem>
            ))}
          </Select>
          <Select
            label="Payment Method"
            selectedKeys={[clonedBillPay.paymentMethod]}
            onChange={(e) => setClonedBillPay({ ...clonedBillPay, paymentMethod: e.target.value })}
          >
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </Select>
          <Input
            label="Subtotal"
            type="number"
            value={(clonedBillPay.subtotal / 100).toString()}
            onChange={(e) =>
              setClonedBillPay({ ...clonedBillPay, subtotal: Math.round(parseFloat(e.target.value) * 100) })
            }
          />
          <Input
            label="Tip Amount"
            type="number"
            value={(clonedBillPay.tipAmount / 100).toString()}
            onChange={(e) =>
              setClonedBillPay({ ...clonedBillPay, tipAmount: Math.round(parseFloat(e.target.value) * 100) })
            }
          />
          <Input
            label="Total"
            type="number"
            value={(clonedBillPay.total / 100).toString()}
            onChange={(e) =>
              setClonedBillPay({ ...clonedBillPay, total: Math.round(parseFloat(e.target.value) * 100) })
            }
          />
          <Input
            label="Currency"
            value={clonedBillPay.currency}
            onChange={(e) => setClonedBillPay({ ...clonedBillPay, currency: e.target.value })}
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

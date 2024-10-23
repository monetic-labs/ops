import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useState } from "react";

import { DisbursementMethod, MerchantDisbursementEventGetOutput, StableCurrency } from "@backpack-fux/pylon-sdk";

interface BillPayCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  billPay: MerchantDisbursementEventGetOutput;
  onSave: (clonedBillPay: MerchantDisbursementEventGetOutput) => void;
}

export default function BillPayCloneModal({ isOpen, onClose, billPay, onSave }: BillPayCloneModalProps) {
  const [clonedBillPay, setClonedBillPay] = useState<MerchantDisbursementEventGetOutput>({
    ...billPay,
    id: `clone-${Date.now()}`, // Generate a new id for the cloned bill pay
  });

  const handleSave = () => {
    onSave(clonedBillPay);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Clone Bill Pay</ModalHeader>
        <ModalBody>
          <Input
            label="Vendor"
            isDisabled
            value={clonedBillPay.contact.accountOwnerName}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                contact: { ...clonedBillPay.contact, accountOwnerName: e.target.value },
              })
            }
          />
          <Select
            label="Payment Method"
            isDisabled
            selectedKeys={clonedBillPay.paymentMethod}
            selectionMode="single"
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                paymentMethod: e.target.value as DisbursementMethod,
              })
            }
          >
            {Object.values(DisbursementMethod).map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </Select>
          <Input
            label="Amount"
            type="number"
            value={clonedBillPay.amountIn.toString()}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                amountIn: e.target.value,
              })
            }
          />
          <Input
            label="Currency"
            isDisabled
            value={clonedBillPay.currencyIn}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                currencyIn: e.target.value as StableCurrency,
              })
            }
          />
          <Input
            label="Receiving Bank Name"
            isDisabled
            value={clonedBillPay.contact.bankName}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                contact: {
                  ...clonedBillPay.contact,
                  bankName: e.target.value,
                },
              })
            }
          />
          <Input
            label="Routing Number"
            isDisabled
            value={clonedBillPay.contact.routingNumber}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                contact: {
                  ...clonedBillPay.contact,
                  routingNumber: e.target.value,
                },
              })
            }
          />
          <Input
            label="Account Number"
            isDisabled
            value={clonedBillPay.contact.accountNumber}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                contact: {
                  ...clonedBillPay.contact,
                  accountNumber: e.target.value,
                },
              })
            }
          />
          <Input
            label="Memo"
            value={clonedBillPay.paymentMessage}
            onChange={(e) =>
              setClonedBillPay({
                ...clonedBillPay,
                paymentMessage: e.target.value,
              })
            }
          />
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSave}>
            Create Transfer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import { useState } from "react";
import { Button } from "@nextui-org/button";
import { Checkbox } from "@nextui-org/checkbox";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";

import { BillPay } from "@/data";

interface BillPaySaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  billPay: BillPay;
  onSave: (updatedBillPay: BillPay, saveAsTemplate: boolean) => void;
}

export default function BillPaySaveModal({
  isOpen,
  onClose,
  billPay,
  onSave,
}: BillPaySaveModalProps) {
  const [editedBillPay, setEditedBillPay] = useState<BillPay>(billPay);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const handleSave = () => {
    onSave(editedBillPay, saveAsTemplate);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Save Bill Pay</ModalHeader>
        <ModalBody>
          <Input
            label="Vendor"
            value={editedBillPay.vendor}
            onChange={(e) =>
              setEditedBillPay({ ...editedBillPay, vendor: e.target.value })
            }
          />
          <Input
            label="Payment Method"
            value={editedBillPay.paymentMethod}
            onChange={(e) =>
              setEditedBillPay({
                ...editedBillPay,
                paymentMethod: e.target.value as BillPay["paymentMethod"],
              })
            }
          />
          <Input
            label="Amount"
            type="number"
            value={editedBillPay.amount.toString()}
            onChange={(e) =>
              setEditedBillPay({
                ...editedBillPay,
                amount: e.target.value,
              })
            }
          />
          <Input
            label="Currency"
            value={editedBillPay.currency}
            onChange={(e) =>
              setEditedBillPay({ ...editedBillPay, currency: e.target.value })
            }
          />
          <Input
            label="Receiving Bank Name"
            value={editedBillPay.receivingBank.name}
            onChange={(e) =>
              setEditedBillPay({
                ...editedBillPay,
                receivingBank: {
                  ...editedBillPay.receivingBank,
                  name: e.target.value,
                },
              })
            }
          />
          <Input
            label="Routing Number"
            value={editedBillPay.receivingBank.routingNumber}
            onChange={(e) =>
              setEditedBillPay({
                ...editedBillPay,
                receivingBank: {
                  ...editedBillPay.receivingBank,
                  routingNumber: e.target.value,
                },
              })
            }
          />
          <Input
            label="Account Number"
            value={editedBillPay.receivingBank.accountNumber}
            onChange={(e) =>
              setEditedBillPay({
                ...editedBillPay,
                receivingBank: {
                  ...editedBillPay.receivingBank,
                  accountNumber: e.target.value,
                },
              })
            }
          />
          <Input
            label="Memo"
            value={editedBillPay.receivingBank.memo}
            onChange={(e) =>
              setEditedBillPay({
                ...editedBillPay,
                receivingBank: {
                  ...editedBillPay.receivingBank,
                  memo: e.target.value,
                },
              })
            }
          />
          <Checkbox
            isSelected={saveAsTemplate}
            onValueChange={setSaveAsTemplate}
          >
            Save as Vendor Template
          </Checkbox>
          {saveAsTemplate && (
            <Input
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Cancel</Button>
          <Button
            className="bg-ualert-500 text-notpurple-500"
            onPress={handleSave}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

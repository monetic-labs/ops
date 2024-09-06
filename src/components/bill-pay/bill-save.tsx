import { useState } from "react";
import { Button } from "@nextui-org/button";
import { Checkbox } from "@nextui-org/checkbox";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { TransactionListItem } from "@backpack-fux/pylon-sdk";

interface BillPaySaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  billPay: TransactionListItem;
  onSave: (updatedBillPay: TransactionListItem, saveAsTemplate: boolean) => void;
}

export default function BillPaySaveModal({ isOpen, onClose, billPay, onSave }: BillPaySaveModalProps) {
  const [editedBillPay, setEditedBillPay] = useState<TransactionListItem>(billPay);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const handleSave = () => {
    onSave(editedBillPay, saveAsTemplate);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Save Transaction</ModalHeader>
        <ModalBody>
          <Input
            label="Status"
            value={editedBillPay.status}
            onChange={(e) =>
              setEditedBillPay({ ...editedBillPay, status: e.target.value as TransactionListItem["status"] })
            }
          />
          <Input
            label="Processor"
            value={editedBillPay.processor}
            onChange={(e) =>
              setEditedBillPay({ ...editedBillPay, processor: e.target.value as TransactionListItem["processor"] })
            }
          />
          <Input
            label="Payment Method"
            value={editedBillPay.paymentMethod}
            onChange={(e) => setEditedBillPay({ ...editedBillPay, paymentMethod: e.target.value })}
          />
          <Input
            label="Subtotal"
            type="number"
            value={(editedBillPay.subtotal / 100).toString()}
            onChange={(e) =>
              setEditedBillPay({ ...editedBillPay, subtotal: Math.round(parseFloat(e.target.value) * 100) })
            }
          />
          <Input
            label="Tip Amount"
            type="number"
            value={(editedBillPay.tipAmount / 100).toString()}
            onChange={(e) =>
              setEditedBillPay({ ...editedBillPay, tipAmount: Math.round(parseFloat(e.target.value) * 100) })
            }
          />
          <Input
            label="Total"
            type="number"
            value={(editedBillPay.total / 100).toString()}
            onChange={(e) =>
              setEditedBillPay({ ...editedBillPay, total: Math.round(parseFloat(e.target.value) * 100) })
            }
          />
          <Input
            label="Currency"
            value={editedBillPay.currency}
            onChange={(e) => setEditedBillPay({ ...editedBillPay, currency: e.target.value })}
          />
          <Checkbox isSelected={saveAsTemplate} onValueChange={setSaveAsTemplate}>
            Save as Template
          </Checkbox>
          {saveAsTemplate && (
            <Input label="Template Name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
          )}
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Cancel</Button>
          <Button className="bg-ualert-500 text-notpurple-500" onPress={handleSave}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useState } from "react";

interface CreateBillPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newBillPay: NewBillPay) => void;
}

interface NewBillPay {
  vendorName: string;
  vendorMethod: string;
  routingNumber: string;
  accountNumber: string;
  memo: string;
  internalNote: string;
  amount: string;
  fee: string;
  total: string;
}

const vendorMethods = ["ACH", "Wire", "SWIFT", "SEPA"];

export default function CreateBillPayModal({ isOpen, onClose, onSave }: CreateBillPayModalProps) {
  const [newBillPay, setNewBillPay] = useState<NewBillPay>({
    vendorName: "",
    vendorMethod: "ACH",
    routingNumber: "",
    accountNumber: "",
    memo: "",
    internalNote: "",
    amount: "",
    fee: "",
    total: "",
  });

  const handleSave = () => {
    onSave(newBillPay);
    onClose();
  };

  const calculateTotal = () => {
    const amount = parseFloat(newBillPay.amount) || 0;
    const fee = parseFloat(newBillPay.fee) || 0;

    return (amount + fee).toFixed(2);
  };

  const handleAmountOrFeeChange = (field: "amount" | "fee", value: string) => {
    setNewBillPay((prev) => ({
      ...prev,
      [field]: value,
      total: calculateTotal(),
    }));
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Create New Bill Pay</ModalHeader>
        <ModalBody>
          <Input
            label="Vendor Name"
            value={newBillPay.vendorName}
            onChange={(e) => setNewBillPay({ ...newBillPay, vendorName: e.target.value })}
          />
          <Select
            label="Vendor Method"
            selectedKeys={[newBillPay.vendorMethod]}
            onChange={(e) => setNewBillPay({ ...newBillPay, vendorMethod: e.target.value })}
          >
            {vendorMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </Select>
          <Input
            label="Routing Number"
            value={newBillPay.routingNumber}
            onChange={(e) => setNewBillPay({ ...newBillPay, routingNumber: e.target.value })}
          />
          <Input
            label="Account Number"
            value={newBillPay.accountNumber}
            onChange={(e) => setNewBillPay({ ...newBillPay, accountNumber: e.target.value })}
          />
          <Input
            label="Memo"
            value={newBillPay.memo}
            onChange={(e) => setNewBillPay({ ...newBillPay, memo: e.target.value })}
          />
          <Input
            label="Internal Note"
            value={newBillPay.internalNote}
            onChange={(e) => setNewBillPay({ ...newBillPay, internalNote: e.target.value })}
          />
          <Input
            label="Amount"
            type="number"
            value={newBillPay.amount}
            onChange={(e) => handleAmountOrFeeChange("amount", e.target.value)}
          />
          <Input
            label="Fee"
            type="number"
            value={newBillPay.fee}
            onChange={(e) => handleAmountOrFeeChange("fee", e.target.value)}
          />
          <Input isReadOnly label="Total" type="number" value={newBillPay.total} />
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSave}>
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

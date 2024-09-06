import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useState } from "react";
import { TransactionListItem, PaymentProcessor } from "@backpack-fux/pylon-sdk";

interface CreateBillPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTransaction: Partial<TransactionListItem>) => void;
}

const paymentMethods = ["CARD", "ACH", "WIRE", "CRYPTO"];
const processors: PaymentProcessor[] = ["WORLDPAY"];

export default function CreateBillPayModal({ isOpen, onClose, onSave }: CreateBillPayModalProps) {
  const [newTransaction, setNewTransaction] = useState<Partial<TransactionListItem>>({
    status: "PENDING",
    processor: "WORLDPAY",
    paymentMethod: "CARD",
    subtotal: 0,
    tipAmount: 0,
    total: 0,
    currency: "USD",
  });

  const handleSave = () => {
    onSave(newTransaction);
    onClose();
  };

  const calculateTotal = (subtotal: number, tipAmount: number) => {
    return subtotal + tipAmount;
  };

  const handleAmountChange = (field: "subtotal" | "tipAmount", value: string) => {
    const numValue = Math.round(parseFloat(value) * 100) || 0;
    setNewTransaction((prev) => {
      const updatedTransaction = { ...prev, [field]: numValue };
      return {
        ...updatedTransaction,
        total: calculateTotal(
          field === "subtotal" ? numValue : prev.subtotal!,
          field === "tipAmount" ? numValue : prev.tipAmount!
        ),
      };
    });
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Create New Transaction</ModalHeader>
        <ModalBody>
          <Select
            label="Processor"
            selectedKeys={[newTransaction.processor!]}
            onChange={(e) => setNewTransaction({ ...newTransaction, processor: e.target.value as PaymentProcessor })}
          >
            {processors.map((processor) => (
              <SelectItem key={processor} value={processor}>
                {processor}
              </SelectItem>
            ))}
          </Select>
          <Select
            label="Payment Method"
            selectedKeys={[newTransaction.paymentMethod!]}
            onChange={(e) => setNewTransaction({ ...newTransaction, paymentMethod: e.target.value })}
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
            value={(newTransaction.subtotal! / 100).toString()}
            onChange={(e) => handleAmountChange("subtotal", e.target.value)}
          />
          <Input
            label="Tip Amount"
            type="number"
            value={(newTransaction.tipAmount! / 100).toString()}
            onChange={(e) => handleAmountChange("tipAmount", e.target.value)}
          />
          <Input isReadOnly label="Total" type="number" value={(newTransaction.total! / 100).toString()} />
          <Input
            label="Currency"
            value={newTransaction.currency}
            onChange={(e) => setNewTransaction({ ...newTransaction, currency: e.target.value })}
          />
          {/* Add inputs for billing and shipping addresses if needed */}
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

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useEffect, useState } from "react";

interface CardLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  currentLimit: string;
  onSave: (amount: string, cycle: string) => void;
}

const cycles = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
  { value: "all-time", label: "All-time" },
];

export default function CardLimitModal({ isOpen, onClose, cardName, currentLimit, onSave }: CardLimitModalProps) {
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState("");

  useEffect(() => {
    if (currentLimit) {
      const [, limitAmount, , limitCycle] = currentLimit.split(" ");

      setAmount(limitAmount.replace("$", ""));
      setCycle(limitCycle);
    }
  }, [currentLimit]);

  const handleSave = () => {
    onSave(amount, cycle);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Adjust Card Limit</ModalHeader>
        <ModalBody>
          <p>Card: {cardName}</p>
          <p>Current Limit: {currentLimit}</p>
          <Input
            label="New Limit Amount"
            placeholder="Enter amount"
            labelPlacement="outside"
            value={amount}
            classNames={{
              label: "text-sm font-medium text-foreground/90",
              input: "text-base",
              inputWrapper: "h-12",
            }}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Select
            label="Limit Cycle"
            placeholder="Select cycle"
            labelPlacement="outside"
            value={cycle}
            classNames={{
              label: "text-sm font-medium text-foreground/90",
              trigger: "h-12",
              value: "text-base",
            }}
            onChange={(e) => setCycle(e.target.value)}
          >
            {cycles.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSave}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

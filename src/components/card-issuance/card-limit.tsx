import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
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
            classNames={{
              label: "text-sm font-medium text-foreground/90",
              input: "text-base",
              inputWrapper: "h-12",
            }}
            label="New Limit Amount"
            labelPlacement="outside"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Select
            classNames={{
              label: "text-sm font-medium text-foreground/90",
              trigger: "h-12",
              value: "text-base",
            }}
            label="Limit Cycle"
            labelPlacement="outside"
            placeholder="Select cycle"
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
          >
            {cycles.map((c) => (
              <SelectItem key={c.value} textValue={c.label}>
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

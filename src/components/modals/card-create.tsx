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

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const cardTypes = [
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
];

export default function CreateCardModal({
  isOpen,
  onClose,
}: CreateCardModalProps) {
  const [cardName, setCardName] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardType, setCardType] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [limitCycle, setLimitCycle] = useState("");

  const handleCreateCard = () => {
    // Implement card creation logic here
    console.log("Creating card:", {
      cardName,
      cardHolder,
      cardType,
      limit: { amount: limitAmount, cycle: limitCycle },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Create New Card
        </ModalHeader>
        <ModalBody>
          <Input
            label="Card Name"
            placeholder="Enter card name"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
          />
          <Input
            label="Card Holder"
            placeholder="Enter card holder name"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
          />
          <Select
            label="Card Type"
            placeholder="Select card type"
            value={cardType}
            onChange={(e) => setCardType(e.target.value)}
          >
            {cardTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </Select>
          <Input
            label="Limit Amount"
            placeholder="Enter limit amount"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
          />
          <Input
            label="Limit Cycle"
            placeholder="Enter limit cycle (e.g., month, week)"
            value={limitCycle}
            onChange={(e) => setLimitCycle(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleCreateCard}>
            Create Card
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

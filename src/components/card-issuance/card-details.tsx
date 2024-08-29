import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";
import { Progress } from "@nextui-org/progress";
import { Snippet } from "@nextui-org/snippet";
import { useState } from "react";

interface CardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    cardName: string;
    holder: string;
    type: string;
    status: string;
    limit: {
      amount: string;
      cycle: string;
    };
    cardNumber: string;
    expDate: string;
    cvv: string;
    billingAddress: string;
    email: string;
  } | null;
}

export default function CardDetailsModal({
  isOpen,
  onClose,
  card,
}: CardDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Implement save logic here
  };

  const handleLock = () => {
    // Implement lock logic
  };

  const handleReplace = () => {
    // Implement replace logic
  };

  const handleRemove = () => {
    // Implement remove logic
  };

  const handleCancel = () => {
    // Implement cancel logic
  };

  if (!card) return null;

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Card Details</ModalHeader>
        <ModalBody>
          <Input
            isReadOnly={!isEditing}
            label="Card Name"
            value={card.cardName}
          />
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Chip
                color={card.status === "Active" ? "success" : "danger"}
                variant="flat"
              >
                {card.status}
              </Chip>
              <Chip color="primary" variant="flat">
                {card.type}
              </Chip>
            </div>
            <p className="text-small text-default-500 mb-2">
              Limit: ${card.limit.amount} per {card.limit.cycle}
            </p>
            <Progress
              className="mt-2"
              maxValue={10000}
              value={parseInt(card.limit.amount)}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow space-y-2">
              <p className="text-small text-default-500">Card Number</p>
              <Snippet
                codeString={card.cardNumber}
                color="default"
                symbol=""
                variant="flat"
              >
                {card.cardNumber.replace(/(\d{4})/g, "$1 ").trim()}
              </Snippet>
            </div>
            <div className="w-full md:w-1/4 space-y-2">
              <p className="text-small text-default-500">Expiration Date</p>
              <Snippet
                codeString={card.expDate}
                color="default"
                symbol=""
                variant="flat"
              >
                {card.expDate}
              </Snippet>
            </div>
            <div className="w-full md:w-1/6 space-y-2">
              <p className="text-small text-default-500">CVV</p>
              <Snippet
                codeString={card.cvv}
                color="default"
                symbol=""
                variant="flat"
              >
                {card.cvv}
              </Snippet>
            </div>
          </div>
          <Input isReadOnly={!isEditing} label="Holder" value={card.holder} />
          <Input
            isReadOnly={!isEditing}
            label="Billing Address"
            value={card.billingAddress}
          />
          <Input isReadOnly={!isEditing} label="Email" value={card.email} />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" variant="light" onPress={handleLock}>
            Lock
          </Button>
          <Button color="primary" variant="light" onPress={handleReplace}>
            Replace
          </Button>
          <Button color="danger" variant="light" onPress={handleRemove}>
            Remove
          </Button>
          <Button color="warning" variant="light" onPress={handleCancel}>
            Cancel
          </Button>
          {isEditing ? (
            <Button color="primary" onPress={handleSave}>
              Save
            </Button>
          ) : (
            <Button color="primary" onPress={handleEdit}>
              Edit
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import React, { useState } from "react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { FormModal } from "@/components/generics/form-modal";
import ModalFooterWithSupport from "@/components/generics/footer-modal-support";

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const cardTypes = [
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
];

export default function CreateCardModal({ isOpen, onClose }: CreateCardModalProps) {
  const [cardName, setCardName] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardType, setCardType] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [limitCycle, setLimitCycle] = useState("");

  const handleCreateCard = () => {
    console.log("Creating card:", {
      cardName,
      cardHolder,
      cardType,
      limit: { amount: limitAmount, cycle: limitCycle },
    });
    onClose();
  };

  const handleSupportClick = () => {
    console.log("Support clicked");
  };

  const isFormValid = true;

  const footerActions = [
    {
      label: "Create Card",
      onClick: handleCreateCard,
      isDisabled: !isFormValid,
    },
  ];

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Card"
      onSubmit={handleCreateCard}
      isValid={isFormValid} 
    >
      <>
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
        <ModalFooterWithSupport
          onSupportClick={handleSupportClick}
          actions={footerActions}
        />
      </>
    </FormModal>
  );
}
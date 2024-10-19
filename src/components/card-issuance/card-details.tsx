// REFAC THIS LATER

import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";
import { Progress } from "@nextui-org/progress";
import { Snippet } from "@nextui-org/snippet";
import { useEffect, useState } from "react";
import ModalFooterWithSupport from "../generics/footer-modal-support";
import { MerchantCardGetOutput } from "@backpack-fux/pylon-sdk";
import pylon from "@/libs/pylon-sdk";

interface CardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: MerchantCardGetOutput["cards"][number] & { avatar?: string };
}

export default function CardDetailsModal({ isOpen, onClose, card }: CardDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [cvv, setCvv] = useState<string | null>();
  const [pan, setPan] = useState<string | null>();

  useEffect(() => {
    if (card && !card.cardShippingDetails) {
      pylon
        .decryptVirtualCard(card.id)
        .catch(console.log)
        .then((details) => {
          if (details) {
            setCvv(details.decryptedCvc);
            setPan(details.decryptedPan);
          }
        });
    }
  }, [card, setCvv, setPan]);

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

  const handleSupportClick = () => {
    console.log("Support clicked");
  };

  if (!card) return null;

  const footerActions = [
    {
      label: "Lock",
      onClick: handleLock,
      className: "bg-transparent text-notpurple-500 hover:bg-ualert-500",
    },
    {
      label: "Replace",
      onClick: handleReplace,
      className: "bg-transparent text-notpurple-500 hover:bg-ualert-500",
    },
    {
      label: "Remove",
      onClick: handleRemove,
      className: "bg-transparent text-notpurple-500 hover:bg-ualert-500",
    },
    {
      label: isEditing ? "Save" : "Edit",
      onClick: isEditing ? handleSave : handleEdit,
      className: "text-notpurple-500 hover:bg-ualert-500/60",
    },
  ];

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Card Details</ModalHeader>
        <ModalBody>
          <Input isReadOnly={!isEditing} label="Card Name" value={card.displayName} />
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Chip color={card.status === "ACTIVE" ? "success" : "danger"} variant="flat">
                {card.status}
              </Chip>
              <Chip color="primary" variant="flat">
                {card.cardShippingDetails ? "PHYSICAL" : "VIRTUAL"}
              </Chip>
            </div>
            {/* <p className="text-small text-default-500 mb-2">
              Limit: ${card.limit.amount} per {card.limit.cycle}
            </p> */}
            {/* <Progress className="mt-2" maxValue={10000} value={parseInt(card.limit.amount)} /> */}
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            {pan ? (
              <div className="flex-grow space-y-2">
                <p className="text-small text-default-500">Card Number</p>
                <Snippet codeString={pan} color="default" symbol="" variant="flat">
                  {card.lastFour}
                </Snippet>
              </div>
            ) : null}
            <div className="w-full md:w-1/4 space-y-2">
              <p className="text-small text-default-500">Expiration Date</p>
              <Snippet
                codeString={card.expirationMonth + "/" + card.expirationYear}
                color="default"
                symbol=""
                variant="flat"
              >
                {card.expirationMonth + "/" + card.expirationYear}
              </Snippet>
            </div>
            {cvv ? (
              <div className="w-full md:w-1/6 space-y-2">
                <p className="text-small text-default-500">CVV</p>
                <Snippet codeString={cvv} color="default" symbol="" variant="flat">
                  {cvv}
                </Snippet>
              </div>
            ) : null}
          </div>
          <Input
            isReadOnly={!isEditing}
            label="Holder"
            value={card.cardOwner.firstName + " " + card.cardOwner.lastName}
          />
          {card.cardShippingDetails ? (
            <Input
              isReadOnly={!isEditing}
              label="Billing Address"
              // @ts-ignore
              value={`${card.cardShippingDetails.street1}, ${card.cardShippingDetails.city}, ${card.cardShippingDetails.state},${card.cardShippingDetails.country}`}
            />
          ) : null}

          <Input isReadOnly={!isEditing} label="Email" value={card.cardOwner.email} />
        </ModalBody>
        <ModalFooterWithSupport onSupportClick={handleSupportClick} actions={footerActions} />
      </ModalContent>
    </Modal>
  );
}

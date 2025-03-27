import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Modal, ModalBody, ModalContent } from "@heroui/modal";
import { Divider } from "@heroui/divider";
import { useState, useEffect } from "react";
import {
  CardLimitFrequency,
  CardStatus,
  MerchantCardGetOutput,
  UpdateMerchantCardDataInput,
} from "@backpack-fux/pylon-sdk";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon, DollarSign, Calendar, CreditCard, Mail, MapPin, Lock, User, Eye, EyeOff } from "lucide-react";

import pylon from "@/libs/pylon-sdk";
import { formatAmountUSD } from "@/utils/helpers";
import { UpateCardSchema } from "@/data";
import { useCardSensitiveInfo } from "@/hooks/card-issuance/useCardSensitiveInfo";

import CardEdit from "./card-edit";

type HybridCard = MerchantCardGetOutput["cards"][number] & {
  avatar?: string;
  type: string;
  limit: number;
  limitFrequency: CardLimitFrequency;
  holder: string;
};

interface CardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: HybridCard | null;
}

export default function CardDetailsModal({ isOpen, onClose, card: propsCard }: CardDetailsModalProps) {
  const [card, setCard] = useState<HybridCard | null>(propsCard);
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>();
  const [loading, setLoading] = useState(false);

  const {
    sensitiveInfo,
    isLoading: isLoadingSensitive,
    error: sensitiveError,
    isVisible,
    toggleVisibility,
  } = useCardSensitiveInfo(card?.id || "");

  useEffect(() => {
    setCard(propsCard);
    setIsEditing(false);
    setUpdateError(null);
  }, [propsCard]);

  const form = useForm<z.input<typeof UpateCardSchema>>({
    resolver: zodResolver(UpateCardSchema),
    defaultValues: {
      status: card?.status || CardStatus.NOT_ACTIVATED,
      limitAmount: card?.limit?.toString() || "0",
      limitFrequency: card?.limitFrequency || CardLimitFrequency.MONTH,
    },
  });

  const handleEdit = async (data: z.input<typeof UpateCardSchema>) => {
    if (!card) return;

    setUpdateError(null);
    const finalPayload = {} as UpdateMerchantCardDataInput;

    if (data.status !== card.status) {
      finalPayload.status = data.status as CardStatus;
    }
    if (data.limitAmount !== card.limit.toString() || data.limitFrequency !== card.limitFrequency) {
      finalPayload.limit = {
        amount: Number(data.limitAmount),
        frequency: data.limitFrequency as CardLimitFrequency,
      };
    }
    if (Object.keys(finalPayload).length < 1) {
      return;
    }

    try {
      setLoading(true);
      await pylon.updateRainCard({
        cardId: card.id,
        status: finalPayload.status,
        limit: finalPayload.limit,
      });

      setCard((c) => {
        if (!c) return null;

        return {
          ...c,
          limit: Number(data.limitAmount) || c.limit,
          limitFrequency: (data.limitFrequency as CardLimitFrequency) || c.limitFrequency,
          status: (data.status as CardStatus) || c.status,
        };
      });
      setIsEditing(false);
    } catch (error: any) {
      setUpdateError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!card) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "LOCKED":
        return "danger";
      default:
        return "default";
    }
  };

  const renderReadOnlyField = (label: string, value: string | number, icon?: React.ReactNode, endContent?: string) => (
    <div className="flex items-center justify-between gap-2 bg-content2 p-2.5 rounded-medium">
      <div className="flex items-center gap-2">
        {icon && <span className="text-foreground/50">{icon}</span>}
        <span className="text-sm text-foreground/60">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value}</span>
        {endContent && <span className="text-xs text-foreground/50">{endContent}</span>}
      </div>
    </div>
  );

  return (
    <Modal
      hideCloseButton
      classNames={{
        base: "bg-content1",
        backdrop: "bg-black/80",
      }}
      isOpen={isOpen}
      size="md"
      onClose={onClose}
    >
      <ModalContent>
        {isEditing ? (
          <CardEdit
            cardName={card.displayName}
            error={updateError}
            form={form}
            isLoading={loading}
            onCancel={() => setIsEditing(false)}
            onSubmit={form.handleSubmit(handleEdit)}
          />
        ) : (
          <>
            <div className="flex flex-col px-6 py-4 border-b border-divider">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-normal text-foreground">{card.displayName}</h3>
                <Button
                  isIconOnly
                  className="text-foreground/60 hover:text-foreground transition-colors"
                  variant="light"
                  onClick={onClose}
                >
                  <XIcon size={18} />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Chip
                  className="h-7 px-3"
                  color={getStatusColor(card.status)}
                  startContent={card.status === "ACTIVE" ? <Lock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  variant="flat"
                >
                  {card.status}
                </Chip>
                <Chip
                  className="h-7 px-3"
                  color="primary"
                  startContent={<CreditCard className="w-3 h-3" />}
                  variant="flat"
                >
                  {card.cardShippingDetails ? "PHYSICAL" : "VIRTUAL"}
                </Chip>
              </div>
            </div>
            <ModalBody className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {renderReadOnlyField(
                  "Card Limit",
                  formatAmountUSD(card.limit),
                  <DollarSign className="w-4 h-4" />,
                  `per ${card.limitFrequency.toLowerCase()}`
                )}

                <div className="grid grid-cols-2 gap-2">
                  {renderReadOnlyField(
                    "Expiration",
                    `${card.expirationMonth}/${card.expirationYear}`,
                    <Calendar className="w-4 h-4" />
                  )}
                  {!card.cardShippingDetails && (
                    <div className="flex items-center justify-between gap-2 bg-content2 p-2.5 rounded-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/50">
                          <Lock className="w-4 h-4" />
                        </span>
                        <span className="text-sm text-foreground/60">CVV</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isVisible ? (
                          <span className="text-sm font-medium">{sensitiveInfo?.cvv}</span>
                        ) : (
                          <span className="text-sm font-medium">•••</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!card.cardShippingDetails && (
                  <>
                    <div className="flex items-center justify-between gap-2 bg-content2 p-2.5 rounded-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/50">
                          <CreditCard className="w-4 h-4" />
                        </span>
                        <span className="text-sm text-foreground/60">Card Number</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isVisible ? (
                          <span className="text-sm font-medium">{sensitiveInfo?.pan}</span>
                        ) : (
                          <span className="text-sm font-medium">•••• •••• •••• {card.lastFour}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        className="text-foreground/60 hover:text-foreground bg-content2/50 hover:bg-content2"
                        endContent={isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        isLoading={isLoadingSensitive}
                        size="sm"
                        variant="flat"
                        onPress={toggleVisibility}
                      >
                        {isVisible ? "Hide Details" : "Show Details"}
                      </Button>
                    </div>
                    {sensitiveError && <p className="text-danger text-sm mt-1">{sensitiveError}</p>}
                  </>
                )}
              </div>

              <Divider className="my-2" />

              <div className="space-y-2">
                {renderReadOnlyField(
                  "Card Holder",
                  `${card.cardOwner.firstName} ${card.cardOwner.lastName}`,
                  <User className="w-4 h-4" />
                )}
                {renderReadOnlyField("Email", card.cardOwner.email, <Mail className="w-4 h-4" />)}
              </div>

              {card.cardShippingDetails && (
                <>
                  <Divider className="my-2" />
                  <div>
                    {renderReadOnlyField(
                      "Shipping Address",
                      `${card.cardShippingDetails.line1}${
                        card.cardShippingDetails.line2 ? `, ${card.cardShippingDetails.line2}` : ""
                      }, ${card.cardShippingDetails.city}, ${card.cardShippingDetails.countryCode} ${
                        card.cardShippingDetails.postalCode
                      }`,
                      <MapPin className="w-4 h-4" />
                    )}
                  </div>
                </>
              )}
            </ModalBody>
            <div className="px-6 py-4 border-t border-divider">
              <div className="flex justify-end gap-3 w-full">
                <Button className="bg-content2 text-foreground hover:bg-content3" onClick={onClose}>
                  Close
                </Button>
                <Button className="bg-primary text-primary-foreground" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";
import { Snippet } from "@nextui-org/snippet";
import { useEffect, useState } from "react";
import {
  CardLimitFrequency,
  CardStatus,
  MerchantCardGetOutput,
  UpdateMerchantCardDataInput,
} from "@backpack-fux/pylon-sdk";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectItem } from "@nextui-org/select";

import pylon from "@/libs/pylon-sdk";
import { formatAmountUSD } from "@/utils/helpers";
import { limitCyclesObject, limitStatesObject, UpateCardSchema } from "@/data";

import { FormInput } from "../generics/form-input";

type HybridCard = MerchantCardGetOutput["cards"][number] & {
  avatar?: string;
  type: string;
  limit: number;
  limitFrequency: CardLimitFrequency;
  holder: string;
};

interface CardDetailsModalProps {
  isOpen: boolean;
  onClose: (card: HybridCard) => void;
  card: HybridCard;
}

export default function CardDetailsModal({ isOpen, onClose, card: propsCard }: CardDetailsModalProps) {
  const [card, setCard] = useState(propsCard);
  const [isEditing, setIsEditing] = useState(false);
  const [cvv, setCvv] = useState<string | null>();
  const [pan, setPan] = useState<string | null>();
  const [updateError, setUpdateError] = useState<string | null>();

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

  const handleEdit = async (data: z.infer<typeof UpateCardSchema>) => {
    setUpdateError(null);
    const finalPayload = {} as UpdateMerchantCardDataInput;

    if (data.status !== card.status) {
      finalPayload.status = data.status as CardStatus;
    }
    if (data.limitAmount !== card.limit || data.limitFrequency !== card.limitFrequency) {
      finalPayload.limit = {
        amount: data.limitAmount,

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

      setCard(
        (c) =>
          ({
            ...c,
            limit: data.limitAmount || card.limit,
            limitFrequency: data.limitFrequency || card.limitFrequency,
            status: (data.status as CardStatus) || card.status,
          }) as any
      );
      setLoading(false);
    } catch (error: any) {
      setUpdateError(error.message);
      setLoading(false);
    }
  };

  const [loading, setLoading] = useState(false);
  const {
    control: control,
    formState: { errors },
    handleSubmit: handleSubmit,
  } = useForm<z.infer<typeof UpateCardSchema>>({
    resolver: zodResolver(UpateCardSchema),
    defaultValues: {
      status: card.status,
      limitAmount: card.limit.toString() as any,
      limitFrequency: card.limitFrequency,
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      size="2xl"
      onClose={() => {
        onClose(card);
      }}
    >
      {isEditing ? (
        <ModalContent>
          <ModalHeader className="flex items-center">
            <p>Edit card - {card.displayName}</p>
          </ModalHeader>
          <ModalBody>
            <FormInput
              about="Limit Amount"
              control={control}
              data-testid="card-limitAmount"
              errorMessage={errors.limitAmount?.message}
              label="Limit amount"
              min={1}
              name="limitAmount"
              placeholder="Limit amount"
              type="number"
            />

            <Controller
              control={control}
              name="limitFrequency"
              render={({ field, formState: { errors } }) => {
                return (
                  <div>
                    <Select
                      data-testid="card-limitFrequency"
                      defaultSelectedKeys={[card.limitFrequency]}
                      label="Card limit cycle"
                      placeholder="Select card limit cycle"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {limitCyclesObject.map((t) => (
                        <SelectItem key={t.value} data-testid={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.limitFrequency?.message && (
                      <p className="mt-1 text-sm text-ualert-500">{errors.limitFrequency?.message}</p>
                    )}
                  </div>
                );
              }}
            />

            <Controller
              control={control}
              name="status"
              render={({ field, formState: { errors } }) => {
                return (
                  <div>
                    <Select
                      data-testid="card-status"
                      defaultSelectedKeys={[card.status]}
                      label="Status"
                      placeholder="Select status"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {limitStatesObject.map((t) => (
                        <SelectItem key={t.value} data-testid={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.status?.message && <p className="mt-1 text-sm text-ualert-500">{errors.status?.message}</p>}
                  </div>
                );
              }}
            />
          </ModalBody>
          {updateError ? <p className="text-danger-300 px-6">{updateError}</p> : null}
          <div className="flex items-center px-6 mb-6 mt-4 justify-end">
            <Button
              className={`text-notpurple-500 w-full sm:w-auto mr-4 `}
              onPress={() => {
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className={`bg-ualert-500 text-notpurple-500 w-full sm:w-auto `}
              disabled={loading}
              isLoading={loading}
              onPress={() => handleSubmit(handleEdit)()}
            >
              Save
            </Button>
          </div>
        </ModalContent>
      ) : (
        <ModalContent>
          <ModalHeader className="flex items-center">
            <p>Card Details</p>
          </ModalHeader>
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
              <p className="text-small text-default-500 mb-2">
                Limit: ${formatAmountUSD(card.limit)} per {card.limitFrequency}
              </p>
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
          <div className="flex items-center px-6 mb-6 mt-4 justify-end">
            <Button
              className={`text-notpurple-500 w-full sm:w-auto mr-4 `}
              onClick={() => {
                setIsEditing(true);
              }}
            >
              Edit
            </Button>
            <Button
              className={`bg-ualert-500 text-notpurple-500 w-full sm:w-auto `}
              onClick={() => {
                onClose(card);
              }}
            >
              Close
            </Button>
          </div>
        </ModalContent>
      )}
    </Modal>
  );
}

import React, { useState } from "react";
import { CardType, CardStatus, ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@nextui-org/button";

import { CreateCardSchema } from "@/validations/card";
import pylon from "@/libs/pylon-sdk";
import { FormModal } from "@/components/generics/form-modal";

import { BasicInfoStep } from "./steps/basic-info";
import { CardLimitsStep } from "./steps/card-limits";
import { ShippingDetailsStep } from "./steps/shipping-details";

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormData = z.infer<typeof CreateCardSchema>;

export default function CreateCardModal({ isOpen, onClose }: CreateCardModalProps) {
  const [error, setError] = useState<string | null>();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(CreateCardSchema),
    defaultValues: {
      displayName: "",
      ownerFirstName: "",
      ownerLastName: "",
      ownerEmail: "",
      cardType: CardType.VIRTUAL,
      limitAmount: 0,
      limitFrequency: undefined,
      shipping: undefined,
    },
    mode: "onTouched",
  });

  const cardType = form.watch("cardType");
  const totalSteps = cardType === CardType.PHYSICAL ? 3 : 2;

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      if (data.cardType === CardType.PHYSICAL) {
        if (!data.shipping) {
          setError("Shipping details are required for physical cards");

          return;
        }

        await pylon.createPhysicalCard({
          displayName: data.displayName,
          limit: { amount: data.limitAmount, frequency: data.limitFrequency },
          owner: { firstName: data.ownerFirstName, lastName: data.ownerLastName, email: data.ownerEmail },
          status: CardStatus.ACTIVE,
          shipping: {
            ...data.shipping,
            countryCode: data.shipping.country as ISO3166Alpha2Country,
            line1: data.shipping.street1,
            line2: data.shipping.street2,
          },
        });
      } else {
        await pylon.createVirtualCard({
          displayName: data.displayName,
          limit: { amount: data.limitAmount, frequency: data.limitFrequency },
          owner: { firstName: data.ownerFirstName, lastName: data.ownerLastName, email: data.ownerEmail },
          status: CardStatus.ACTIVE,
        });
      }

      form.reset();
      window.location.reload();
    } catch (error: any) {
      setError(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all duration-300 ${
            index + 1 === currentStep
              ? "w-8 bg-primary"
              : index + 1 < currentStep
                ? "w-2 bg-primary/60"
                : "w-2 bg-content3"
          }`}
        />
      ))}
    </div>
  );

  const renderStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Card Type & Basic Info";
      case 2:
        return "Card Limits & Settings";
      case 3:
        return "Shipping Details";
      default:
        return "";
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep form={form} />;
      case 2:
        return <CardLimitsStep form={form} />;
      case 3:
        return cardType === CardType.PHYSICAL ? <ShippingDetailsStep form={form} /> : null;
      default:
        return null;
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      isValid={true}
      title={
        <div className="space-y-2">
          <h3 className="text-xl font-normal text-foreground">Create New Card</h3>
          <p className="text-sm text-foreground/60">{renderStepTitle()}</p>
        </div>
      }
      onClose={onClose}
      onSubmit={() => {}}
    >
      <div className="space-y-6">
        {renderStepIndicator()}
        {renderCurrentStep()}
        {error && <p className="text-danger mt-4">{error}</p>}
        <div className="flex gap-2 justify-end">
          {currentStep > 1 && (
            <Button
              className="bg-content2 text-foreground hover:bg-content3"
              variant="flat"
              onPress={() => setCurrentStep((prev) => prev - 1)}
            >
              Previous
            </Button>
          )}
          {currentStep === 1 && (
            <Button className="bg-content2 text-foreground hover:bg-content3" variant="flat" onPress={onClose}>
              Cancel
            </Button>
          )}
          {currentStep < totalSteps ? (
            <Button
              className="bg-primary text-primary-foreground hover:opacity-90"
              onPress={() => setCurrentStep((prev) => prev + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              className="bg-primary text-primary-foreground hover:opacity-90"
              data-testid="card-createButton"
              isDisabled={loading}
              isLoading={loading}
              onPress={() => form.handleSubmit(onSubmit)()}
            >
              Create Card
            </Button>
          )}
        </div>
      </div>
    </FormModal>
  );
}

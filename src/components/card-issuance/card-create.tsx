import React, { useMemo, useState } from "react";
import { Select, SelectItem } from "@nextui-org/select";
import { FormModal } from "@/components/generics/form-modal";
import { CardType } from "@backpack-fux/pylon-sdk";
import pylon from "@/libs/pylon-sdk";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "../generics/form-input";
import { AutocompleteInput } from "../generics/autocomplete-input";
import {
  CreateCardSchema,
  CreateCardModalProps,
  CardShippingDetailsSchema,
  limitCyclesObject,
  shippingMethodOptions,
  cardDeliveryCountries,
  getRegionsForCountry,
} from "@/data";
import { Button } from "@nextui-org/button";
import { CardStatus, ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

export default function CreateCardModal({ isOpen, onClose }: CreateCardModalProps) {
  const [error, setError] = useState<string | null>();
  const [cardType, setCardType] = useState(CardType.VIRTUAL);
  const [loading, setLoading] = useState(false);
  const {
    control: controlFirstForm,
    formState: { errors: firstFormErrors },
    handleSubmit: handleFirstFormSubmit,
    getValues,
    reset: resetFirstForm,
  } = useForm<z.infer<typeof CreateCardSchema>>({
    resolver: zodResolver(CreateCardSchema),
    defaultValues: { displayName: "", ownerFirstName: "", ownerLastName: "", ownerEmail: "", limitAmount: 0 },
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(CardShippingDetailsSchema),
    defaultValues: {
      street1: "",
      street2: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
      phoneNumber: "",
      phoneCountryCode: "",
      shippingMethod: undefined,
    },
  });

  const onSubmitSecondForm = async (secondData: z.infer<typeof CardShippingDetailsSchema>) => {
    try {
      setLoading(true);
      const data = getValues();
      await pylon.createPhysicalCard({
        displayName: data.displayName,
        limit: { amount: data.limitAmount, frequency: data.limitFrequency },
        owner: { firstName: data.ownerFirstName, lastName: data.ownerLastName, email: data.ownerEmail },
        status: CardStatus.ACTIVE,
        shipping: {
          ...secondData,
          countryCode: secondData.country as ISO3166Alpha2Country,
          line1: secondData.street1,
          line2: secondData.street2,
        },
      });
      reset();
      resetFirstForm();
      onClose();
    } catch (error: any) {
      setError(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const onSubmitFirstForm = async (data: z.infer<typeof CreateCardSchema>) => {
    try {
      setLoading(true);
      switch (cardType) {
        case CardType.PHYSICAL: {
          handleSubmit(onSubmitSecondForm)();
          break;
        }
        case CardType.VIRTUAL: {
          await pylon.createVirtualCard({
            displayName: data.displayName,
            limit: { amount: data.limitAmount, frequency: data.limitFrequency },
            owner: { firstName: data.ownerFirstName, lastName: data.ownerLastName, email: data.ownerEmail },
            status: CardStatus.ACTIVE,
          });
          resetFirstForm();
          onClose();
          break;
        }
        default: {
          break;
        }
      }
    } catch (error: any) {
      setError(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const country = watch("country");

  const regions = useMemo(() => getRegionsForCountry(country), [country]);

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Create New Card" onSubmit={() => {}} isValid={true}>
      <>
        <Select
          data-testid="card-selector"
          label="Card Type"
          placeholder="Select card type"
          value={cardType}
          onChange={(e) => setCardType(e.target.value as CardType)}
          defaultSelectedKeys={[CardType.VIRTUAL]}
        >
          <SelectItem value={CardType.VIRTUAL} key={CardType.VIRTUAL}>
            Virtual
          </SelectItem>
          <SelectItem data-testid="card-physical" key={CardType.PHYSICAL} value={CardType.PHYSICAL}>
            Physical
          </SelectItem>
        </Select>
        <FormInput
          data-testid="card-displayName"
          about="Enter card name"
          control={controlFirstForm}
          errorMessage={firstFormErrors.displayName?.message}
          label="Card Name"
          name="displayName"
          placeholder="Enter card name"
        />
        <FormInput
          data-testid="card-firstName"
          about="Enter card holder's first name"
          control={controlFirstForm}
          errorMessage={firstFormErrors.ownerFirstName?.message}
          label="Card holder's first name"
          name="ownerFirstName"
          placeholder="Enter card holder's first name"
        />
        <FormInput
          data-testid="card-lastName"
          about="Enter card holder's last name"
          control={controlFirstForm}
          errorMessage={firstFormErrors.ownerLastName?.message}
          label="Card holder's last name"
          name="ownerLastName"
          placeholder="Enter card holder's last name"
        />
        <FormInput
          data-testid="card-email"
          about="Enter card holder's email"
          control={controlFirstForm}
          errorMessage={firstFormErrors.ownerEmail?.message}
          label="Card holder's email"
          name="ownerEmail"
          placeholder="Enter card holder's email"
          type="email"
        />
        <FormInput
          data-testid="card-limitAmount"
          about="Limit Amount"
          control={controlFirstForm}
          errorMessage={firstFormErrors.limitAmount?.message}
          label="Enter limit amount"
          name="limitAmount"
          placeholder="Enter limit amount"
          type="number"
          min={1}
        />

        <AutocompleteInput
          testid="card-limitCycle"
          control={controlFirstForm}
          about="Select card limit cycle"
          errorMessage={firstFormErrors.limitFrequency?.message}
          label="Limit Cycle"
          name="limitFrequency"
          placeholder="Select card limit cycle"
          items={limitCyclesObject}
        />
        {cardType === CardType.PHYSICAL ? (
          <>
            <p>Shipping Details</p>
            <FormInput
              data-testid="card-address"
              about="Enter address line 1"
              control={control}
              errorMessage={errors.street1?.message}
              label="Address Line 1"
              name="street1"
              placeholder="Enter address line 1"
            />
            <FormInput
              data-testid="card-address2"
              about="Enter address line 2 (optional)"
              control={control}
              errorMessage={errors.street2?.message}
              label="Address Line 2"
              name="street2"
              placeholder="Enter address line 2 (optional)"
            />
            <FormInput
              data-testid="card-city"
              about="Enter city"
              control={control}
              errorMessage={errors.city?.message}
              label="City"
              name="city"
              placeholder="Enter city"
            />

            <FormInput
              data-testid="card-postalCode"
              about="Enter postal code"
              control={control}
              errorMessage={errors.postalCode?.message}
              label="Postal Code"
              name="postalCode"
              placeholder="Enter postal code"
            />

            <AutocompleteInput
              testid="card-country"
              control={control}
              about="Select country"
              errorMessage={errors.country?.message}
              label="Country"
              name="country"
              placeholder="Select country"
              items={cardDeliveryCountries}
            />

            <AutocompleteInput
              testid="card-region"
              control={control}
              about="Select region"
              errorMessage={errors.region?.message}
              label="Region"
              name="region"
              placeholder="Select region"
              items={regions}
            />

            <FormInput
              data-testid="card-phoneNumber"
              about="Enter phone number"
              control={control}
              errorMessage={errors.phoneNumber?.message}
              label="Phone Number"
              name="phoneNumber"
              placeholder="Enter phone number"
            />
            <FormInput
              data-testid="card-phoneCountryCode"
              about="Enter phone country code"
              control={control}
              errorMessage={errors.phoneCountryCode?.message}
              label="Phone Country Code"
              name="phoneCountryCode"
              placeholder="Enter phone country code (e.g., 1)"
              maxLength={3}
            />
            <AutocompleteInput
              testid="card-shippingMethod"
              control={control}
              about="Select shipping method"
              errorMessage={errors.shippingMethod?.message}
              label="Shipping Method"
              name="shippingMethod"
              placeholder="Select shipping method"
              items={shippingMethodOptions}
            />
          </>
        ) : null}
        {error ? <p className="text-danger-300">{error}</p> : null}
        <div className="flex justify-between">
          <Button
            data-testid="card-createButton"
            className={`bg-ualert-500 text-notpurple-500 w-full sm:w-auto`}
            onPress={() => {
              if (loading) return;
              setError(null);

              handleFirstFormSubmit(onSubmitFirstForm)();
            }}
            isLoading={loading}
            isDisabled={loading}
          >
            Create Card
          </Button>
        </div>
      </>
    </FormModal>
  );
}

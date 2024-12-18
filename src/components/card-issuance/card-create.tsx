import React, { useMemo, useState } from "react";
import { Select, SelectItem } from "@nextui-org/select";
import { CardType } from "@backpack-fux/pylon-sdk";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@nextui-org/button";
import { CardStatus, ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

import {
  CreateCardSchema,
  CreateCardModalProps,
  CardShippingDetailsSchema,
  limitCyclesObject,
  shippingMethodOptions,
  cardDeliveryCountries,
  getRegionsForCountry,
} from "@/data";
import pylon from "@/libs/pylon-sdk";
import { FormModal } from "@/components/generics/form-modal";

import { FormInput } from "../generics/form-input";

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
      window.location.reload();
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
          window.location.reload();
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
    <FormModal isOpen={isOpen} isValid={true} title="Create New Card" onClose={onClose} onSubmit={() => {}}>
      <>
        <Select
          data-testid="card-selector"
          defaultSelectedKeys={[CardType.VIRTUAL]}
          label="Card Type"
          placeholder="Select card type"
          value={cardType}
          onChange={(e) => setCardType(e.target.value as CardType)}
        >
          <SelectItem key={CardType.VIRTUAL} value={CardType.VIRTUAL}>
            Virtual
          </SelectItem>
          <SelectItem key={CardType.PHYSICAL} data-testid="card-physical" value={CardType.PHYSICAL}>
            Physical
          </SelectItem>
        </Select>
        <FormInput
          about="Enter card name"
          control={controlFirstForm}
          data-testid="card-displayName"
          errorMessage={firstFormErrors.displayName?.message}
          label="Card Name"
          name="displayName"
          placeholder="Enter card name"
        />
        <FormInput
          about="Enter card holder's first name"
          control={controlFirstForm}
          data-testid="card-firstName"
          errorMessage={firstFormErrors.ownerFirstName?.message}
          label="Card holder's first name"
          name="ownerFirstName"
          placeholder="Enter card holder's first name"
        />
        <FormInput
          about="Enter card holder's last name"
          control={controlFirstForm}
          data-testid="card-lastName"
          errorMessage={firstFormErrors.ownerLastName?.message}
          label="Card holder's last name"
          name="ownerLastName"
          placeholder="Enter card holder's last name"
        />
        <FormInput
          about="Enter card holder's email"
          control={controlFirstForm}
          data-testid="card-email"
          errorMessage={firstFormErrors.ownerEmail?.message}
          label="Card holder's email"
          name="ownerEmail"
          placeholder="Enter card holder's email"
          type="email"
        />
        <FormInput
          about="Limit Amount"
          control={controlFirstForm}
          data-testid="card-limitAmount"
          errorMessage={firstFormErrors.limitAmount?.message}
          label="Enter limit amount"
          min={1}
          name="limitAmount"
          placeholder="Enter limit amount"
          type="number"
        />

        <Controller
          control={controlFirstForm}
          name="limitFrequency"
          render={({ field, formState: { errors } }) => {
            return (
              <div>
                <Select
                  data-testid="card-limitCycle"
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

        {cardType === CardType.PHYSICAL ? (
          <>
            <p>Shipping Details</p>
            <FormInput
              about="Enter address line 1"
              control={control}
              data-testid="card-address"
              errorMessage={errors.street1?.message}
              label="Address Line 1"
              name="street1"
              placeholder="Enter address line 1"
            />
            <FormInput
              about="Enter address line 2 (optional)"
              control={control}
              data-testid="card-address2"
              errorMessage={errors.street2?.message}
              label="Address Line 2"
              name="street2"
              placeholder="Enter address line 2 (optional)"
            />
            <FormInput
              about="Enter city"
              control={control}
              data-testid="card-city"
              errorMessage={errors.city?.message}
              label="City"
              name="city"
              placeholder="Enter city"
            />

            <FormInput
              about="Enter postal code"
              control={control}
              data-testid="card-postalCode"
              errorMessage={errors.postalCode?.message}
              label="Postal Code"
              name="postalCode"
              placeholder="Enter postal code"
            />

            <Controller
              control={control}
              name="country"
              render={({ field, formState: { errors } }) => {
                return (
                  <div>
                    <Select
                      data-testid="card-country"
                      label="Country"
                      placeholder="Select country"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {cardDeliveryCountries.map((t) => (
                        <SelectItem key={t.value} data-testid={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.country?.message && (
                      <p className="mt-1 text-sm text-ualert-500">{errors.country?.message}</p>
                    )}
                  </div>
                );
              }}
            />

            <Controller
              control={control}
              name="region"
              render={({ field, formState: { errors } }) => {
                return (
                  <div>
                    <Select
                      data-testid="card-region"
                      label="Region"
                      placeholder="Select region"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {regions.map((t) => (
                        <SelectItem key={t.value} data-testid={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.region?.message && <p className="mt-1 text-sm text-ualert-500">{errors.region?.message}</p>}
                  </div>
                );
              }}
            />

            <FormInput
              about="Enter phone number"
              control={control}
              data-testid="card-phoneNumber"
              errorMessage={errors.phoneNumber?.message}
              label="Phone Number"
              name="phoneNumber"
              placeholder="Enter phone number"
            />
            <FormInput
              about="Enter phone country code"
              control={control}
              data-testid="card-phoneCountryCode"
              errorMessage={errors.phoneCountryCode?.message}
              label="Phone Country Code"
              maxLength={3}
              name="phoneCountryCode"
              placeholder="Enter phone country code (e.g., 1)"
            />
            <Controller
              control={control}
              name="shippingMethod"
              render={({ field, formState: { errors } }) => {
                return (
                  <div>
                    <Select
                      data-testid="card-shippingMethod"
                      label="Shipping method"
                      placeholder="Select shipping method"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {shippingMethodOptions.map((t) => (
                        <SelectItem key={t.value} data-testid={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.shippingMethod?.message && (
                      <p className="mt-1 text-sm text-ualert-500">{errors.shippingMethod?.message}</p>
                    )}
                  </div>
                );
              }}
            />
          </>
        ) : null}
        {error ? <p className="text-danger-300">{error}</p> : null}
        <div className="flex justify-between">
          <Button
            className={`bg-ualert-500 text-notpurple-500 w-full sm:w-auto`}
            data-testid="card-createButton"
            isDisabled={loading}
            isLoading={loading}
            onPress={() => {
              if (loading) return;
              setError(null);

              handleFirstFormSubmit(onSubmitFirstForm)();
            }}
          >
            Create Card
          </Button>
        </div>
      </>
    </FormModal>
  );
}

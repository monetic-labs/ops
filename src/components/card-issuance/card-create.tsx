import React, { useMemo, useState } from "react";
import { Select, SelectItem } from "@nextui-org/select";

import { FormModal } from "@/components/generics/form-modal";
import { CardType } from "@backpack-fux/pylon-sdk";
import pylon from "@/libs/pylon-sdk";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "../generics/form-input";
import {
  CreateCardSchema,
  CreateCardModalProps,
  CardShippingDetailsSchema,
  getRegionsForCountry,
  cardDeliveryCountries,
  shippingMethodOptions,
  limitCyclesObject,
} from "@/data";
import { CardStatus, ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@nextui-org/button";

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

        <Controller
          control={controlFirstForm}
          name="limitFrequency"
          render={({ field, formState: { errors } }) => {
            return (
              <div>
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  data-testid="card-limitCycle"
                  label="Card limit cycle"
                  placeholder="Select card limit cycle"
                >
                  {limitCyclesObject.map((t) => (
                    <SelectItem value={t.value} key={t.value} data-testid={t.value}>
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

            <Controller
              control={control}
              name="country"
              render={({ field, formState: { errors } }) => {
                return (
                  <div>
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      data-testid="card-country"
                      label="Country"
                      placeholder="Select country"
                    >
                      {cardDeliveryCountries.map((t) => (
                        <SelectItem value={t.value} key={t.value} data-testid={t.value}>
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
                      value={field.value}
                      onChange={field.onChange}
                      data-testid="card-region"
                      label="Region"
                      placeholder="Select region"
                    >
                      {regions.map((t) => (
                        <SelectItem value={t.value} key={t.value} data-testid={t.value}>
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
            <Controller
              control={control}
              name="shippingMethod"
              render={({ field, formState: { errors } }) => {
                return (
                  <div>
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      data-testid="card-shippingMethod"
                      label="Shipping method"
                      placeholder="Select shipping method"
                    >
                      {shippingMethodOptions.map((t) => (
                        <SelectItem value={t.value} key={t.value} data-testid={t.value}>
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

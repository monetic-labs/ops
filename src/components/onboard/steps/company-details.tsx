"use client";

import { useFormContext, Controller } from "react-hook-form";
import { FormField } from "../form-fields";
import postcodeMap from "@/data/postcodes-map.json";
import { ChangeEvent, useCallback, useEffect } from "react";
import { Input } from "@nextui-org/input";

export const CompanyDetailsStep = () => {
  const {
    watch,
    setValue,
    control,
    formState: { errors },
  } = useFormContext();

  const handlePostcodeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>, onChange: (value: any) => void) => {
      const postcodeValue = e.target.value;
      onChange(postcodeValue);

      if (postcodeValue && postcodeMap[postcodeValue]) {
        const data = postcodeMap[postcodeValue];
        // Use requestAnimationFrame to defer state updates
        requestAnimationFrame(() => {
          setValue("city", data.city || "", { shouldValidate: false });
          setValue("state", data.stateAbbreviation || "", { shouldValidate: false });
        });
      }
    },
    [setValue]
  );

  // Use useEffect to validate after city/state updates
  useEffect(() => {
    const postcode = watch("postcode");
    if (postcode && postcodeMap[postcode]) {
      const data = postcodeMap[postcode];
      setValue("city", data.city || "", { shouldValidate: true });
      setValue("state", data.stateAbbreviation || "", { shouldValidate: true });
    }
  }, [watch("postcode"), setValue, watch]);

  return (
    <div className="mb-8 space-y-4">
      <Controller
        control={control}
        name="companyName"
        render={({ field }) => (
          <Input
            {...field}
            errorMessage={errors?.companyName?.message?.toString()}
            isInvalid={!!errors?.companyName}
            label="Company Name"
            placeholder="Algersoft"
          />
        )}
      />
      <Controller
        control={control}
        name="companyEmail"
        render={({ field }) => (
          <Input
            {...field}
            errorMessage={errors?.companyEmail?.message?.toString()}
            isInvalid={!!errors?.companyEmail}
            label="Company Email"
            placeholder="hello@algersoft.com"
            type="email"
          />
        )}
      />
      <Controller
        control={control}
        name="companyWebsite"
        render={({ field }) => (
          <Input
            {...field}
            errorMessage={errors?.companyWebsite?.message?.toString()}
            isInvalid={!!errors?.companyWebsite}
            label="Company Website"
            placeholder="example.com"
            startContent={
              <div className="pointer-events-none flex items-center">
                <span className="text-default-400 text-small">https://</span>
              </div>
            }
            type="text"
          />
        )}
      />
      <div className="flex space-x-4">
        <Controller
          control={control}
          name="postcode"
          render={({ field }) => (
            <Input
              {...field}
              errorMessage={errors?.postcode?.message?.toString()}
              isInvalid={!!errors?.postcode}
              label="Postcode"
              maxLength={5}
              placeholder="10001"
              onChange={(e) => handlePostcodeChange(e, field.onChange)}
            />
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field }) => (
            <Input
              {...field}
              errorMessage={errors?.city?.message?.toString()}
              isDisabled
              isInvalid={!!errors?.city}
              label="City"
              placeholder="New York"
            />
          )}
        />
        <Controller
          control={control}
          name="state"
          render={({ field }) => (
            <Input
              {...field}
              errorMessage={errors?.state?.message?.toString()}
              isDisabled
              isInvalid={!!errors?.state}
              label="State"
              maxLength={2}
              placeholder="NY"
            />
          )}
        />
      </div>
      <Controller
        control={control}
        name="streetAddress1"
        render={({ field }) => (
          <Input
            {...field}
            errorMessage={errors?.streetAddress1?.message?.toString()}
            isInvalid={!!errors?.streetAddress1}
            label="Street Address 1"
            placeholder="123 Main St"
          />
        )}
      />
      <Controller
        control={control}
        name="streetAddress2"
        render={({ field }) => (
          <Input
            {...field}
            errorMessage={errors?.streetAddress2?.message?.toString()}
            isInvalid={!!errors?.streetAddress2}
            label="Street Address 2 (Optional)"
            placeholder="Apt 4B"
          />
        )}
      />
    </div>
  );
};

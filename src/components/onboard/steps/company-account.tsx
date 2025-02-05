"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectItem } from "@nextui-org/select";
import { CardCompanyType } from "@backpack-fux/pylon-sdk";
import { Input } from "@nextui-org/input";

import { formatCompanyType, formatEIN } from "@/utils/helpers";

import { FormField } from "../form-fields";

export const CompanyAccountStep = () => {
  const {
    formState: { errors },
    control,
    watch,
  } = useFormContext();

  const companyType = watch("companyType");

  return (
    <div className="mb-8 space-y-6">
      <div className="space-y-4">
        {/** We pass in the settlement address as a default value */}
        {/* <FormField
          label="Settlement Address"
          maxLength={42}
          name="settlementAddress"
          placeholder="0x1234567890123456789012345678901234567890"
        /> */}
        <FormField
          label="Company Registration Number"
          maxLength={12}
          name="companyRegistrationNumber"
          placeholder="1234567"
        />
        <Controller
          control={control}
          name="companyTaxId"
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              errorMessage={error?.message}
              isInvalid={!!error}
              label="Company Tax ID"
              maxLength={10}
              placeholder="12-3456789"
              value={field.value ? formatEIN(field.value) : ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");

                if (digits.length <= 9) {
                  field.onChange(digits);
                }
              }}
            />
          )}
        />
        <Controller
          control={control}
          name="companyType"
          render={({ field, fieldState: { error } }) => (
            <Select
              {...field}
              fullWidth
              errorMessage={error?.message}
              isInvalid={!!error}
              label="Company Type"
              placeholder="Select Company Type"
              selectedKeys={companyType ? [companyType] : []}
              onChange={(e) => field.onChange(e.target.value)}
            >
              {Object.values(CardCompanyType).map((type) => (
                <SelectItem key={type} value={type}>
                  {formatCompanyType(type)}
                </SelectItem>
              ))}
            </Select>
          )}
        />
        <FormField
          isOptional
          label="Company Description"
          maxLength={100}
          name="companyDescription"
          placeholder="Describe your company"
        />
      </div>
    </div>
  );
};

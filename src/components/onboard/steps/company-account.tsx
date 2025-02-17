"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectItem } from "@nextui-org/select";
import { CardCompanyType } from "@backpack-fux/pylon-sdk";
import { Input } from "@nextui-org/input";
import { Building2, Hash, Receipt } from "lucide-react";

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
          errorMessage={errors?.companyRegistrationNumber?.message?.toString()}
          isInvalid={!!errors?.companyRegistrationNumber}
          label="Company Registration Number"
          maxLength={12}
          name="companyRegistrationNumber"
          placeholder="1234567"
          startContent={<Hash className="text-foreground/40 w-4 h-4 flex-shrink-0" />}
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
              startContent={<Receipt className="text-foreground/40 w-4 h-4 flex-shrink-0" />}
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
              startContent={<Building2 className="text-foreground/40 w-4 h-4 flex-shrink-0" />}
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
          description="Optional - Describe your company's main business activities"
          errorMessage={errors?.companyDescription?.message?.toString()}
          isInvalid={!!errors?.companyDescription}
          label="Company Description"
          maxLength={100}
          name="companyDescription"
          placeholder="Describe your company"
        />
      </div>
    </div>
  );
};

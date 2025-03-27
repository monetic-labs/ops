"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectItem } from "@heroui/select";
import { ChangeEvent } from "react";
import { Input } from "@heroui/input";
import { SharedSelection } from "@heroui/system";
import { ISO3166Alpha2Country, PersonRole } from "@backpack-fux/pylon-sdk";
import { Checkbox } from "@heroui/checkbox";

import postcodeMap from "@/data/postcodes-map.json";
import { FormData } from "@/validations/onboard/schemas";
import { capitalizeFirstChar, formatStringToTitleCase } from "@/utils/helpers";

const formatSSN = (value: string) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
};

export const UserDetailsStep = () => {
  const {
    watch,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<FormData>();
  const users = watch("users");

  return (
    <div className="mb-8 space-y-8">
      {users.map((user: any, index: number) => (
        <div key={index} className="space-y-4 p-4 border border-default-200 rounded-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">
              Person {index + 1}: {watch(`users.${index}.firstName`)} {watch(`users.${index}.lastName`)}
            </h2>
            <div className="text-sm text-default-400">
              {watch(`users.${index}.roles`).map((role: string) => (
                <span key={role} className="mr-2">
                  {role
                    .split("_")
                    .map((word) => capitalizeFirstChar(word))
                    .join(" ")}
                </span>
              ))}
            </div>
          </div>

          <Select
            isRequired
            errorMessage={errors?.users?.[index]?.countryOfIssue?.message}
            isInvalid={!!errors?.users?.[index]?.countryOfIssue}
            label="Country of Issue (for ID)"
            placeholder="Select country"
            selectedKeys={watch(`users.${index}.countryOfIssue`) ? [watch(`users.${index}.countryOfIssue`)] : []}
            onSelectionChange={(keys: SharedSelection) => {
              const selected = Array.from(keys)[0];

              setValue(`users.${index}.countryOfIssue`, selected as ISO3166Alpha2Country, { shouldValidate: true });
            }}
          >
            {Object.values(ISO3166Alpha2Country).map((country) => (
              <SelectItem key={country} textValue={country}>
                {country}
              </SelectItem>
            ))}
          </Select>

          <Controller
            control={control}
            name={`users.${index}.birthDate`}
            render={({ field }) => (
              <Input
                {...field}
                errorMessage={errors?.users?.[index]?.birthDate?.message}
                isInvalid={!!errors?.users?.[index]?.birthDate}
                label="Birth Date"
                placeholder="YYYY-MM-DD"
                type="date"
              />
            )}
          />

          <Controller
            control={control}
            name={`users.${index}.socialSecurityNumber`}
            render={({ field }) => (
              <Input
                {...field}
                errorMessage={errors?.users?.[index]?.socialSecurityNumber?.message}
                isInvalid={!!errors?.users?.[index]?.socialSecurityNumber}
                label="Social Security Number"
                maxLength={11}
                placeholder="XXX-XX-XXXX"
                value={field.value ? formatSSN(field.value) : ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");

                  if (digits.length <= 9) {
                    field.onChange(digits);
                  }
                }}
              />
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <Controller
              control={control}
              name={`users.${index}.postcode`}
              render={({ field }) => (
                <Input
                  {...field}
                  errorMessage={errors?.users?.[index]?.postcode?.message}
                  isInvalid={!!errors?.users?.[index]?.postcode}
                  label="Postcode"
                  maxLength={5}
                  placeholder="12345"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    field.onChange(e);
                    const postcodeValue = e.target.value;

                    if (postcodeValue && postcodeMap[postcodeValue]) {
                      const data = postcodeMap[postcodeValue];

                      setValue(`users.${index}.city`, data.city || "", { shouldValidate: true });
                      setValue(`users.${index}.state`, data.stateAbbreviation || "", { shouldValidate: true });
                    }
                  }}
                />
              )}
            />
            <Controller
              control={control}
              name={`users.${index}.city`}
              render={({ field }) => (
                <Input
                  {...field}
                  errorMessage={errors?.users?.[index]?.city?.message}
                  isDisabled={true}
                  isInvalid={!!errors?.users?.[index]?.city}
                  label="City"
                  placeholder="New York"
                />
              )}
            />
            <Controller
              control={control}
              name={`users.${index}.state`}
              render={({ field }) => (
                <Input
                  {...field}
                  errorMessage={errors?.users?.[index]?.state?.message}
                  isDisabled={true}
                  isInvalid={!!errors?.users?.[index]?.state}
                  label="State"
                  placeholder="NY"
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name={`users.${index}.streetAddress1`}
            render={({ field }) => (
              <Input
                {...field}
                errorMessage={errors?.users?.[index]?.streetAddress1?.message}
                isInvalid={!!errors?.users?.[index]?.streetAddress1}
                label="Street Address 1"
                placeholder="123 Main St"
              />
            )}
          />

          <Controller
            control={control}
            name={`users.${index}.streetAddress2`}
            render={({ field }) => (
              <Input
                {...field}
                errorMessage={errors?.users?.[index]?.streetAddress2?.message}
                isInvalid={!!errors?.users?.[index]?.streetAddress2}
                label="Street Address 2 (Optional)"
                placeholder="Apt 4B"
              />
            )}
          />

          <div className="space-y-4">
            <Controller
              control={control}
              name={`users.${index}.hasDashboardAccess`}
              render={({ field }) => (
                <Checkbox
                  isDisabled={index === 0}
                  isSelected={index === 0 ? true : field.value}
                  onValueChange={(checked) => {
                    field.onChange(checked);
                    if (!checked) {
                      setValue(`users.${index}.dashboardRole`, PersonRole.OWNER);
                    }
                  }}
                >
                  Grant dashboard access to this person
                </Checkbox>
              )}
            />

            {(index === 0 || watch(`users.${index}.hasDashboardAccess`)) && (
              <Controller
                control={control}
                name={`users.${index}.dashboardRole`}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Select
                      isRequired
                      description={
                        index > 0 && watch(`users.${index}.hasDashboardAccess`)
                          ? `An email notification will be sent to ${watch(`users.${index}.email`)} for onboarding`
                          : "You must be an Owner"
                      }
                      errorMessage={error?.message}
                      isDisabled={index === 0}
                      isInvalid={!!error}
                      label="Dashboard Role"
                      placeholder="Select role"
                      selectedKeys={index === 0 ? [PersonRole.OWNER] : field.value ? [field.value] : []}
                      onSelectionChange={(keys: SharedSelection) => {
                        const selected = Array.from(keys)[0];

                        field.onChange(selected as PersonRole);
                      }}
                    >
                      {Object.values(PersonRole).map((role) => (
                        <SelectItem key={role} textValue={formatStringToTitleCase(role)}>
                          {formatStringToTitleCase(role)}
                        </SelectItem>
                      ))}
                    </Select>
                  </>
                )}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

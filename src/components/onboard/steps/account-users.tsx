"use client";

import { Button } from "@nextui-org/button";
import { Checkbox } from "@nextui-org/checkbox";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@nextui-org/input";

import { UserRole } from "@/validations/onboard/schemas";
import { formatPhoneNumber } from "@/utils/helpers";

import { FormField } from "../form-fields";

// Helper function for class names
const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

const RoleCheckbox = ({
  role,
  description,
  examples,
  isSelected,
  onValueChange,
  hasError,
  isDisabled,
}: {
  role: string;
  description: string;
  examples: string;
  isSelected: boolean;
  onValueChange: (selected: boolean) => void;
  hasError?: boolean;
  isDisabled?: boolean;
}) => {
  return (
    <Checkbox
      aria-label={role}
      classNames={{
        base: cn(
          "inline-flex w-full",
          "hover:bg-content2 items-center justify-start",
          "cursor-pointer rounded-lg gap-2 p-4 border-2",
          hasError ? "border-red-500" : "border-default-200",
          isDisabled ? "opacity-70" : ""
        ),
        label: "w-full",
      }}
      isDisabled={isDisabled}
      isSelected={isSelected}
      onValueChange={onValueChange}
    >
      <div className="w-full flex flex-col gap-1">
        <span className="text-medium font-semibold">
          {role
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </span>
        <span className="text-small text-default-500">{description}</span>
        <span className="text-tiny text-default-400">{examples}</span>
      </div>
    </Checkbox>
  );
};

export const AccountUsers = () => {
  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "users",
  });

  // Check if we have at least one of each role
  const allUsers = watch("users") || [];
  const hasBeneficialOwner = allUsers.some((user: any) => user.roles.includes(UserRole.BENEFICIAL_OWNER));
  const hasRepresentative = allUsers.some((user: any) => user.roles.includes(UserRole.REPRESENTATIVE));
  const hasError = !hasBeneficialOwner || !hasRepresentative;

  return (
    <div className="space-y-8">
      {fields.map((field, index) => {
        const userRoles = watch(`users.${index}.roles`) || [];
        const isFirstPerson = index === 0;

        // Set default roles for first person
        if (isFirstPerson && userRoles.length === 0) {
          setValue(`users.${index}.roles`, [UserRole.BENEFICIAL_OWNER, UserRole.REPRESENTATIVE]);
        }

        return (
          <div key={field.id} className="rounded-xl border border-default-200 bg-content1 overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">
                    Person {index + 1}{" "}
                    {isFirstPerson && <span className="text-sm text-[#4B9CFF] font-normal">(Your details)</span>}
                  </h2>
                </div>
                {index > 0 && (
                  <Button color="danger" variant="light" onPress={() => remove(index)}>
                    Remove
                  </Button>
                )}
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="First Name" name={`users.${index}.firstName`} placeholder="Rick" />
                  <FormField label="Last Name" name={`users.${index}.lastName`} placeholder="Sanchez" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Email" name={`users.${index}.email`} placeholder="rick@example.com" type="email" />
                  <Controller
                    control={control}
                    name={`users.${index}.phoneNumber`}
                    render={({ field, fieldState: { error } }) => (
                      <Input
                        {...field}
                        errorMessage={error?.message}
                        isInvalid={!!error}
                        label="Phone Number"
                        placeholder="(234) 567-8901"
                        startContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">+1</span>
                          </div>
                        }
                        type="tel"
                        value={field.value?.number ? formatPhoneNumber(field.value.number) : ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");

                          if (digits.length <= 10) {
                            field.onChange({
                              extension: "1",
                              number: digits,
                            });
                          }
                        }}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <div className="text-sm text-default-500">Roles</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RoleCheckbox
                    description="Has 25% or more ownership stake in the company"
                    examples="e.g. Founder, Major Shareholder"
                    hasError={!isFirstPerson && hasError && !hasBeneficialOwner}
                    isDisabled={isFirstPerson}
                    isSelected={isFirstPerson ? true : userRoles.includes(UserRole.BENEFICIAL_OWNER)}
                    role={UserRole.BENEFICIAL_OWNER}
                    onValueChange={(selected) => {
                      if (!isFirstPerson) {
                        const newRoles = selected
                          ? [...userRoles, UserRole.BENEFICIAL_OWNER]
                          : userRoles.filter((role: string) => role !== UserRole.BENEFICIAL_OWNER);

                        setValue(`users.${index}.roles`, newRoles);
                      }
                    }}
                  />
                  <RoleCheckbox
                    description="Authorized to act or speak for or in support of the company"
                    examples="e.g. CEO, CFO, COO, Managing Director, Attorney"
                    hasError={!isFirstPerson && hasError && !hasRepresentative}
                    isDisabled={isFirstPerson}
                    isSelected={isFirstPerson ? true : userRoles.includes(UserRole.REPRESENTATIVE)}
                    role={UserRole.REPRESENTATIVE}
                    onValueChange={(selected) => {
                      if (!isFirstPerson) {
                        const newRoles = selected
                          ? [...userRoles, UserRole.REPRESENTATIVE]
                          : userRoles.filter((role: string) => role !== UserRole.REPRESENTATIVE);

                        setValue(`users.${index}.roles`, newRoles);
                      }
                    }}
                  />
                </div>
                {!isFirstPerson && userRoles.length === 0 && (
                  <p className="text-red-500 text-sm">At least one role should be selected</p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {hasError && !hasRepresentative && (
        <p className="text-red-500 text-sm">At least one Representative is required</p>
      )}

      <Button
        fullWidth
        className="bg-[#1C1C1C] hover:bg-[#2B2D3C] text-white rounded-xl h-14"
        size="lg"
        startContent={<span>+</span>}
        onPress={() => {
          append({
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            roles: [],
          });
        }}
      >
        Add Another Person
      </Button>
    </div>
  );
};

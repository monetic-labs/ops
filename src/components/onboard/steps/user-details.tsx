"use client";

import { useFormContext } from "react-hook-form";
import { FormField } from "../form-fields";
import { FormData } from "@/validations/onboard/schemas";

export const UserDetailsStep = () => {
  const { watch } = useFormContext<FormData>();
  const users = watch("users");

  return (
    <div className="space-y-4">
      {users.map((_: unknown, index: number) => (
        <div key={index} className="space-y-4">
          <FormField label="First Name" name={`users.${index}.firstName`} placeholder="Enter first name" />
          <FormField label="Last Name" name={`users.${index}.lastName`} placeholder="Enter last name" />
          <FormField label="Email" name={`users.${index}.email`} placeholder="Enter email" type="email" />
          <FormField
            label="Phone Number"
            name={`users.${index}.phoneNumber`}
            placeholder="Enter phone number"
            type="tel"
          />
          <FormField label="Country of Issue" name={`users.${index}.countryOfIssue`} placeholder="Enter country" />
          <FormField label="Birth Date" name={`users.${index}.birthDate`} placeholder="YYYY-MM-DD" type="date" />
          <FormField
            label="Social Security Number"
            name={`users.${index}.socialSecurityNumber`}
            placeholder="XXX-XX-XXXX"
          />
          <FormField
            label="Street Address 1"
            name={`users.${index}.streetAddress1`}
            placeholder="Enter street address"
          />
          <FormField
            isOptional
            label="Street Address 2"
            name={`users.${index}.streetAddress2`}
            placeholder="Enter suite, unit, etc."
          />
          <FormField label="Postcode" maxLength={5} name={`users.${index}.postcode`} placeholder="Enter postcode" />
          <FormField
            isDisabled
            label="City"
            name={`users.${index}.city`}
            placeholder="City will be filled automatically"
          />
          <FormField
            isDisabled
            label="State"
            maxLength={2}
            name={`users.${index}.state`}
            placeholder="State will be filled automatically"
          />
        </div>
      ))}
    </div>
  );
};

"use client";

import { useFormContext } from "react-hook-form";
import { FormField } from "../form-fields";

export const CompanyDetailsStep = () => {
  const { watch } = useFormContext();
  const postcode = watch("postcode");

  return (
    <div className="space-y-4">
      <FormField label="Company Name" name="companyName" placeholder="Enter company name" />
      <FormField label="Company Email" name="companyEmail" placeholder="Enter company email" type="email" />
      <FormField
        isOptional
        label="Company Website"
        name="companyWebsite"
        placeholder="Enter company website"
        type="url"
      />
      <FormField label="Postcode" maxLength={5} name="postcode" placeholder="Enter postcode" />
      <FormField isDisabled label="City" name="city" placeholder="City will be filled automatically" />
      <FormField isDisabled label="State" maxLength={2} name="state" placeholder="State will be filled automatically" />
      <FormField label="Street Address 1" name="streetAddress1" placeholder="Enter street address" />
      <FormField isOptional label="Street Address 2" name="streetAddress2" placeholder="Enter suite, unit, etc." />
    </div>
  );
};

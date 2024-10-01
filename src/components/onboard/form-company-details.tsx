import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormCard } from "@/components/generics/form-card";
import { FormInput } from "@/components/generics/form-input";
import { FormButton } from "@/components/generics/form-button";
import { CompanyDetailsSchema, companyDetailsSchema, walletAddressRegex } from "@/validations/onboard";

export const FormCompanyDetails: React.FC<{
  onSubmit: (data: CompanyDetailsSchema) => void;
  initialData: CompanyDetailsSchema;
  updateFormData: (data: CompanyDetailsSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
  } = useForm<CompanyDetailsSchema>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: initialData,
  });

  const onFormSubmit = handleSubmit(
    (data: CompanyDetailsSchema) => {
      onSubmit(data);
      updateFormData(data);
    },
    (errors) => {
      console.log("Submission errors:", errors);
    }
  );

  return (
    <FormCard className="w-full" title="Company Details">
      <form className="space-y-4" onSubmit={onFormSubmit}>
        <FormInput
          control={control}
          errorMessage={errors.walletAddress?.message}
          label="Wallet Address"
          maxLength={42}
          name="walletAddress"
          pattern={walletAddressRegex.source}
          placeholder="0x1234567890123456789012345678901234567890"
        />
        <FormInput
          control={control}
          errorMessage={errors.companyEIN?.message}
          label="Company EIN"
          name="companyEIN"
          placeholder="12-3456789"
        />
        <FormInput
          control={control}
          errorMessage={errors.companyType?.message}
          label="Company Type"
          name="companyType"
          placeholder="Select Company Type"
          type="autocomplete"
        />
        <FormInput
          control={control}
          errorMessage={errors.companyDescription?.message}
          label="Company Description"
          name="companyDescription"
          placeholder="Describe your company"
        />
        <div className="flex justify-end space-x-4">
          <FormButton type="submit">Submit</FormButton>
        </div>
      </form>
    </FormCard>
  );
};
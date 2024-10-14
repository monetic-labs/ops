import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormCard } from "@/components/generics/form-card";
import { FormInput } from "@/components/generics/form-input";
import { FormButton } from "@/components/generics/form-button";
import { CompanyDetailsSchema, companyDetailsSchema } from "@/validations/app";
import { AutocompleteInput } from "@/components/generics/autocomplete-input";
import { companyEINRegex, walletAddressRegex } from "@/validations/onboard";

const companyTypes = [
  { label: "Sole Proprietorship", value: "sole_proprietorship" },
  { label: "Limited Liability Company (LLC)", value: "llc" },
  { label: "C Corporation", value: "c_corp" },
  { label: "S Corporation", value: "s_corp" },
  { label: "Partnership", value: "partnership" },
  { label: "Limited Partnership (LP)", value: "lp" },
  { label: "Limited Liability Partnership (LLP)", value: "llp" },
  { label: "Nonprofit Corporation", value: "nonprofit" },
];

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
  } = useForm<CompanyDetailsSchema>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    const subscription = watch((value) => {
      updateFormData(value as CompanyDetailsSchema);
    });

    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

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
          about="This is where you will receive your settled funds from your customers."
          control={control}
          errorMessage={errors.walletAddress?.message}
          label="Settlement Address"
          name="walletAddress"
          maxLength={42}
          pattern={walletAddressRegex.source}
          placeholder="0x1234567890123456789012345678901234567890"
        />
        <FormInput
          about="Use the entity responsible for funds moving in and out of the settlement address."
          control={control}
          errorMessage={errors.companyEIN?.message}
          label="Company EIN"
          name="companyEIN"
          maxLength={10}
          pattern={companyEINRegex.source}
          placeholder="12-3456789"
        />
        <AutocompleteInput
          about="Select the type of company structure"
          control={control}
          errorMessage={errors.companyType?.message}
          label="Company Type"
          name="companyType"
          placeholder="Select Company Type"
          items={companyTypes}
        />
        <FormInput
          control={control}
          errorMessage={errors.companyDescription?.message}
          label="Company Description"
          name="companyDescription"
          maxLength={100}
          placeholder="Describe your company"
        />
        <div className="flex justify-end space-x-4">
          <FormButton type="submit">Submit</FormButton>
        </div>
      </form>
    </FormCard>
  );
};
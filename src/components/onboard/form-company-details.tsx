import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardCompanyType } from "@backpack-fux/pylon-sdk";

import { FormCard } from "@/components/generics/form-card";
import { FormInput } from "@/components/generics/form-input";
import { FormButton } from "@/components/generics/form-button";
import { CompanyDetailsSchema, companyDetailsSchema } from "@/types/validations/onboard";
import { AutocompleteInput } from "@/components/generics/autocomplete-input";
import { companyEINRegex, walletAddressRegex } from "@/types/validations/onboard";
import { handleCompanyEINChange } from "../generics/form-input-handlers";
import { handleWalletAddressChange } from "../generics/form-input-handlers";

const companyTypes: { label: string; value: CardCompanyType }[] = [
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
  const [walletAddressInput, setWalletAddressInput] = useState(initialData.walletAddress || "");
  const [companyEINInput, setCompanyEINInput] = useState(initialData.companyEIN || "");
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
          value={walletAddressInput}
          onChange={(e) => handleWalletAddressChange(e, setValue, setWalletAddressInput, "walletAddress")}
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
          value={companyEINInput}
          onChange={(e) => handleCompanyEINChange(e, setValue, setCompanyEINInput, "companyEIN")}
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
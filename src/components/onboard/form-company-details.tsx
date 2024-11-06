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
  { label: "Sole Proprietorship", value: CardCompanyType.SOLE_PROPRIETORSHIP },
  { label: "Limited Liability Company (LLC)", value: CardCompanyType.LLC },
  { label: "C Corporation", value: CardCompanyType.C_CORP },
  { label: "S Corporation", value: CardCompanyType.S_CORP },
  { label: "Partnership", value: CardCompanyType.PARTNERSHIP },
  { label: "Limited Partnership (LP)", value: CardCompanyType.LP },
  { label: "Limited Liability Partnership (LLP)", value: CardCompanyType.LLP },
  { label: "Nonprofit Corporation", value: CardCompanyType.NONPROFIT },
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
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">0x</span>
            </div>
          }
          about="This is where you will receive your settled funds from your customers."
          control={control}
          errorMessage={errors.walletAddress?.message}
          label="Settlement Address"
          name="walletAddress"
          maxLength={42}
          pattern={walletAddressRegex.source}
          placeholder="1234567890123456789012345678901234567890"
          data-testid="company-details-settlement-address-input"
          value={walletAddressInput.replace(/^0x/, "")}
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
          data-testid="company-details-company-ein-input"
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
          testid="company-details-company-type-input"
          items={companyTypes}
        />
        <FormInput
          control={control}
          errorMessage={errors.companyDescription?.message}
          label="Company Description"
          name="companyDescription"
          maxLength={100}
          placeholder="Describe your company"
          data-testid="company-details-company-description-input"
        />
        <div className="flex justify-end space-x-4">
          <FormButton type="submit" data-testid="company-details-submit-button" onClick={onFormSubmit}>
            Submit
          </FormButton>
        </div>
      </form>
    </FormCard>
  );
};

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardCompanyType } from "@backpack-fux/pylon-sdk";

import { FormCard } from "@/components/generics/form-card";
import { FormInput } from "@/components/generics/form-input";
import { FormButton } from "@/components/generics/form-button";
import {
  CompanyDetailsSchema,
  companyDetailsSchema,
  companyRegistrationNumberRegex,
} from "@/types/validations/onboard";
import { AutocompleteInput } from "@/components/generics/autocomplete-input";
import { companyEINRegex, walletAddressRegex } from "@/types/validations/onboard";

import { handleCompanyEINChange, handleCompanyRegistrationNumberChange } from "../generics/form-input-handlers";
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
  const [companyRegistrationNumberInput, setCompanyRegistrationNumberInput] = useState(
    initialData.companyRegistrationNumber || ""
  );
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
          data-testid="company-details-settlement-address-input"
          errorMessage={errors.walletAddress?.message}
          label="Settlement Address"
          maxLength={42}
          name="walletAddress"
          pattern={walletAddressRegex.source}
          placeholder="1234567890123456789012345678901234567890"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">0x</span>
            </div>
          }
          value={walletAddressInput.replace(/^0x/, "")}
          onChange={(e) => handleWalletAddressChange(e, setValue, setWalletAddressInput, "walletAddress")}
        />
        <FormInput
          about="The unique number assigned to your business or legal entity when it is officially registered with the relevant government authorities."
          control={control}
          data-testid="company-details-company-registration-number-input"
          errorMessage={errors.companyRegistrationNumber?.message}
          label="Company Registration Number"
          maxLength={12}
          name="companyRegistrationNumber"
          pattern={companyRegistrationNumberRegex.source}
          placeholder="1234567"
          value={companyRegistrationNumberInput}
          onChange={(e) =>
            handleCompanyRegistrationNumberChange(
              e,
              setValue,
              setCompanyRegistrationNumberInput,
              "companyRegistrationNumber"
            )
          }
        />
        <FormInput
          about="The number issued by the tax authority to identify your entity for tax purposes, required for filing taxes and other official tax-related activities."
          control={control}
          data-testid="company-details-company-ein-input"
          errorMessage={errors.companyEIN?.message}
          label="Company Tax ID"
          maxLength={10}
          name="companyEIN"
          pattern={companyEINRegex.source}
          placeholder="12-3456789"
          value={companyEINInput}
          onChange={(e) => handleCompanyEINChange(e, setValue, setCompanyEINInput, "companyEIN")}
        />
        <AutocompleteInput
          about="Select the type of company structure"
          control={control}
          errorMessage={errors.companyType?.message}
          items={companyTypes}
          label="Company Type"
          name="companyType"
          placeholder="Select Company Type"
          testid="company-details-company-type-input"
        />
        <FormInput
          control={control}
          data-testid="company-details-company-description-input"
          errorMessage={errors.companyDescription?.message}
          label="Company Description"
          maxLength={100}
          name="companyDescription"
          placeholder="Describe your company"
        />
        <div className="flex justify-end space-x-4">
          <FormButton data-testid="company-details-submit-button" type="submit" onPress={() => onFormSubmit()}>
            Submit
          </FormButton>
        </div>
      </form>
    </FormCard>
  );
};

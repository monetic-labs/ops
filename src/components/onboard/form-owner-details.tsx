import React, { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormInput } from "@/components/generics/form-input";
import { birthdayRegex, countryISO3166Alpha2Regex, UserDetailsSchema, userDetailsSchema, ssnRegex, walletAddressRegex } from "@/validations/onboard";
import { FormCardTabs } from "../generics/form-card-tabs";
import { AutocompleteInput } from "../generics/autocomplete-input";
import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

const countries = [
  { label: "United States", value: "US" as ISO3166Alpha2Country },
  { label: "United Kingdom", value: "GB" as ISO3166Alpha2Country },
  { label: "Germany", value: "DE" as ISO3166Alpha2Country },
  { label: "France", value: "FR" as ISO3166Alpha2Country },  
]

type FormData = {
  userDetails: UserDetailsSchema;
};

export const FormOwnerDetails: React.FC<{
  onSubmit: (data: UserDetailsSchema) => void;
  initialData: UserDetailsSchema;
  updateFormData: (data: UserDetailsSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<FormData>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: { userDetails: initialData },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "userDetails",
  });

  useEffect(() => {
    if (fields.length === 0) {
      append({
        countryOfIssue: "US" as ISO3166Alpha2Country,
        walletAddress: "",
        birthday: "",
        ssn: "",
      });
    }
  }, [fields, append]);

  const onFormSubmit = handleSubmit((data: FormData) => {
    onSubmit(data.userDetails);
    updateFormData(data.userDetails);
  });

  const addOwner = () => {
    append({
      countryOfIssue: "US" as ISO3166Alpha2Country,
      walletAddress: "",
      birthday: "",
      ssn: "",
    });
  };

  const removeOwner = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const renderTabTitle = (field: any, index: number) => `Owner ${index + 1}`;

  const renderTabContent = (field: any, index: number) => (
    <div className="space-y-4">
      <AutocompleteInput
        control={control}
        errorMessage={errors.userDetails?.[index]?.countryOfIssue?.message}
        label="Country of Issue"
        name={`userDetails.${index}.countryOfIssue`}
        placeholder="Select a country"
        items={countries.map(country => ({ label: country.label, value: country.value as ISO3166Alpha2Country }))}
        about="Select the country that issued your identification"
      />
      <FormInput
        control={control}
        errorMessage={errors.userDetails?.[index]?.walletAddress?.message}
        label="Wallet Address"
        name={`userDetails.${index}.walletAddress`}
        maxLength={42}
        pattern={walletAddressRegex.source}
        placeholder="0x1234567890123456789012345678901234567890"
      />
      <FormInput
        control={control}
        errorMessage={errors.userDetails?.[index]?.birthday?.message}
        label="Birthday"
        name={`userDetails.${index}.birthday`}
        maxLength={10}
        pattern={birthdayRegex.source}
        placeholder="YYYY-MM-DD"
      />
      <FormInput
        control={control}
        errorMessage={errors.userDetails?.[index]?.ssn?.message}
        label="Social Security"
        name={`userDetails.${index}.ssn`}
        maxLength={11}
        pattern={ssnRegex.source}
        placeholder="123-45-6789"
      />
    </div>
  );

  return (
    <form onSubmit={onFormSubmit}>
      <FormCardTabs
        fields={fields}
        renderTabContent={renderTabContent}
        renderTabTitle={renderTabTitle}
        title="Owner Details"
        onAdd={addOwner}
        onCancel={() => {/* Handle cancel */}}
        onRemove={removeOwner}
        onSubmit={onFormSubmit}
      />
    </form>
  );
};
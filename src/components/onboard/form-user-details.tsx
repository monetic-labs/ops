import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormInput } from "@/components/generics/form-input";
import { birthdayRegex,CompanyUserDetailsSchema, companyUserDetailsSchema, ssnRegex } from "@/types/validations/onboard";
import { FormCardTabs } from "../generics/form-card-tabs";
import { AutocompleteInput } from "../generics/autocomplete-input";
import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";
import { PostcodeInput } from "../generics/form-input-postcode";
import { TabData } from "@/hooks/generics/useDynamicTabs";

const countries = [
  { label: "United States", value: "US" as ISO3166Alpha2Country },
  { label: "United Kingdom", value: "GB" as ISO3166Alpha2Country },
  { label: "Germany", value: "DE" as ISO3166Alpha2Country },
  { label: "France", value: "FR" as ISO3166Alpha2Country },  
]

export const FormUserDetails: React.FC<{
  onSubmit: (data: CompanyUserDetailsSchema) => void;
  initialData: CompanyUserDetailsSchema;
  updateFormData: (data: CompanyUserDetailsSchema) => void;
  userCount: number;
  accountUsers: { firstName: string; lastName: string; }[];
  tabs: TabData[];
  activeTab: string;
  setActiveTab: (key: string) => void;
}> = ({ onSubmit, initialData, updateFormData, accountUsers, tabs }) => {
  const [showAddressInputs, setShowAddressInputs] = useState<boolean[]>(new Array(accountUsers.length).fill(false));

  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
  } = useForm<CompanyUserDetailsSchema>({
    resolver: zodResolver(companyUserDetailsSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    const subscription = watch((value) => {
      updateFormData(value as CompanyUserDetailsSchema);
    });
    
    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

  const onFormSubmit = handleSubmit(
    (data) => {
      console.log("userDetails submitted:", data);
      onSubmit(data);
    },
    (errors) => {
      console.error("Form validation errors:", errors);
    }
  );

  const onPostcodeLookup = (result: any, index: number) => {
    if (result) {
      setValue(`userDetails.${index}.registeredAddress.postcode`, result.postcode, { shouldValidate: true });
      setValue(`userDetails.${index}.registeredAddress.city`, result.city, { shouldValidate: true });
      setValue(`userDetails.${index}.registeredAddress.state`, result.state, { shouldValidate: true });
      const newShowAddressInputs = [...showAddressInputs];
      newShowAddressInputs[index] = true;
      setShowAddressInputs(newShowAddressInputs);
    } else {
      const newShowAddressInputs = [...showAddressInputs];
      newShowAddressInputs[index] = false;
      setShowAddressInputs(newShowAddressInputs);
    }
  };

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
       <PostcodeInput
        about="Address where the owner resides."
        control={control}
        errorMessage={errors.userDetails?.[index]?.registeredAddress?.postcode?.message}
        name={`userDetails.${index}.registeredAddress.postcode`}
        showAddressInputs={showAddressInputs[index]}
        onLookupComplete={(result) => onPostcodeLookup(result, index)}
      />
      {showAddressInputs[index] && (
        <>
          <FormInput
            control={control}
            errorMessage={errors.userDetails?.[index]?.registeredAddress?.street1?.message}
            label="Street Address 1"
            name={`userDetails.${index}.registeredAddress.street1`}
            placeholder="123 Main St"
          />
          <FormInput
            control={control}
            errorMessage={errors.userDetails?.[index]?.registeredAddress?.street2?.message}
            label="Street Address 2"
            name={`userDetails.${index}.registeredAddress.street2`}
            placeholder="Apt 4B"
          />
        </>
      )}
    </div>
  );

  return (
    <form onSubmit={onFormSubmit}>
      <FormCardTabs
        fields={tabs.filter(tab => tab.key.startsWith('user-details-'))}
        renderTabContent={renderTabContent}
        renderTabTitle={(tab) => tab.title}
        title="User Details"
        onCancel={() => {/* Handle cancel */}}
        onSubmit={onFormSubmit}
      />
    </form>
  );
};
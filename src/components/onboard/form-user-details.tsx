import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormInput } from "@/components/generics/form-input";
import { birthdayRegex, countryISO3166Alpha2Regex, UserDetailsSchema, userDetailsSchema, ssnRegex, walletAddressRegex } from "@/validations/onboard";
import { FormCardTabs } from "../generics/form-card-tabs";
import { AutocompleteInput } from "../generics/autocomplete-input";
import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";
import { PostcodeInput } from "../generics/form-input-postcode";
import { useMerchantForm } from "@/hooks/merchant/useMerchantForm";

const countries = [
  { label: "United States", value: "US" as ISO3166Alpha2Country },
  { label: "United Kingdom", value: "GB" as ISO3166Alpha2Country },
  { label: "Germany", value: "DE" as ISO3166Alpha2Country },
  { label: "France", value: "FR" as ISO3166Alpha2Country },  
]

type FormData = {
  userDetails: UserDetailsSchema;
};

export const FormUserDetails: React.FC<{
  onSubmit: (data: UserDetailsSchema) => void;
  initialData: UserDetailsSchema;
  updateFormData: (data: UserDetailsSchema) => void;
  userCount: number;
  accountUsers: { firstName: string; lastName: string; role: string }[];
}> = ({ onSubmit, initialData, updateFormData, userCount, accountUsers }) => {
  const { getUserCount } = useMerchantForm("");
  const [showAddressInputs, setShowAddressInputs] = useState<boolean[]>([]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: { userDetails: initialData },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "userDetails",
  });

  useEffect(() => {
    // Adjust the number of fields to match userCount
    const difference = userCount - fields.length;
    if (difference > 0) {
      // Add fields
      for (let i = 0; i < difference; i++) {
        append({
          countryOfIssue: "US" as ISO3166Alpha2Country,
          birthday: "",
          ssn: "",
          registeredAddress: {
            postcode: "",
            city: "",
            state: "",
            country: "US" as ISO3166Alpha2Country,
            street1: "",
          },
        });
      }
    } else if (difference < 0) {
      // Remove fields
      for (let i = 0; i < Math.abs(difference); i++) {
        remove(fields.length - 1);
      }
    }
  }, [userCount, fields, append, remove]);

  const onFormSubmit = handleSubmit((data: FormData) => {
    onSubmit(data.userDetails);
    updateFormData(data.userDetails);
    console.log("data.userDetails", data.userDetails);
  });


  const addOwner = () => {
    append({
      countryOfIssue: "US" as ISO3166Alpha2Country,
      birthday: "",
      ssn: "",
      registeredAddress: {
        postcode: "",
        street1: "",
        street2: "",
        city: "",
        state: "",
        country: "US" as ISO3166Alpha2Country,
      },
    });
    setShowAddressInputs([...showAddressInputs, false]);
  };

  const removeOwner = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      setShowAddressInputs(showAddressInputs.filter((_, i) => i !== index));
    }
  };

  const renderTabTitle = (field: any, index: number) => {
    const user = accountUsers[index];
    if (user) {
      return `${user.firstName} ${user.lastName} (${user.role})`;
    }
    return `User ${index + 1}`;
  };

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
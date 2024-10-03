import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormCardTabs } from "@/components/generics/form-card-tabs";
import { FormInput } from "@/components/generics/form-input";
import { emailRegex } from "@/validations/auth";
import {
  companyRepresentativeSchema,
  CompanyRepresentativeSchema,
  phoneRegex,
} from "@/validations/onboard";
import { PostcodeInput } from "../generics/form-input-postcode";
import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

export const FormCompanyUsers: React.FC<{
  onSubmit: (data: CompanyRepresentativeSchema) => void;
  initialData: CompanyRepresentativeSchema;
  updateFormData: (data: CompanyRepresentativeSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  
  const router = useRouter();
  const [showAddressInputs, setShowAddressInputs] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CompanyRepresentativeSchema>({
    resolver: zodResolver(companyRepresentativeSchema),
    defaultValues: initialData,
  });

  const onCancel = () => router.push("/auth");

  const watchPostcode = watch("representatives.0.registeredAddress.postcode");

  useEffect(() => {
    if (watchPostcode && watchPostcode.length === 5) {
      setShowAddressInputs(true);
    } else {
      setShowAddressInputs(false);
    }
  }, [watchPostcode]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name) {
        console.log("user form data", value);
        updateFormData(value as CompanyRepresentativeSchema);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "representatives",
  });
  console.log("fields", fields);

  const handleFormSubmit = handleSubmit((data) => {
    console.log("Representatives submitted:", data);
    onSubmit(data);
  });

  const addUser = () => {
    append({
      name: "",
      surname: "",
      email: "",
      phoneNumber: "",
      registeredAddress: {
        postcode: "",
        city: "",
        state: "",
        country: "US" as ISO3166Alpha2Country,
        street1: "",
      },
    });
  };

  const removeUser = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const renderTabTitle = (field: any, index: number) => {
    const name = field.name || "";
    const surname = field.surname || "";

    return name || surname ? `${name} ${surname}`.trim() : `User ${index + 1}`;
  };

  const renderTabContent = (field: any, index: number) => (
    <div className="space-y-4">
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[index]?.name?.message}
        label="First Name"
        maxLength={25}
        name={`representatives.${index}.name`}
        placeholder="Rick"
      />
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[index]?.surname?.message}
        label="Last Name"
        maxLength={25}
        name={`representatives.${index}.surname`}
        placeholder="Sanchez"
      />
      <FormInput
        about="Use the email for the primary contact for this company."
        control={control}
        errorMessage={errors.representatives?.[index]?.email?.message}
        label="Email"
        name={`representatives.${index}.email`}
        pattern={emailRegex.source}
        placeholder="nope@algersoft.com"
      />
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[index]?.phoneNumber?.message}
        label="Phone Number"
        name={`representatives.${index}.phoneNumber`}
        pattern={phoneRegex.source}
        placeholder="0701234567"
      />
      <PostcodeInput
        control={control}
        errorMessage={errors.representatives?.[index]?.registeredAddress?.postcode?.message}
        name={`representatives.${index}.registeredAddress.postcode`}
        showAddressInputs={showAddressInputs}
        onLookupComplete={(result) => {
          if (result) {
            setValue(`representatives.${index}.registeredAddress.postcode`, result.postcode, { shouldValidate: true });
            setValue(`representatives.${index}.registeredAddress.city`, result.city, { shouldValidate: true });
            setValue(`representatives.${index}.registeredAddress.state`, result.state, { shouldValidate: true });
            setShowAddressInputs(true);
          } else {
            setShowAddressInputs(false);
          }
          console.log("Postcode lookup result:", result);
        }}
      />
      <div className={`fade-in ${showAddressInputs ? "show" : ""}`}>
        <FormInput
          control={control}
          errorMessage={errors.representatives?.[index]?.registeredAddress?.street1?.message}
          label="Street Address 1"
          name={`representatives.${index}.registeredAddress.street1`}
          placeholder="123 Main St"
        />
      </div>
      <div className={`fade-in ${showAddressInputs ? "show" : ""}`}>
        <FormInput
          control={control}
          errorMessage={errors.representatives?.[index]?.registeredAddress?.street2?.message}
          label="Street Address 2"
          name={`representatives.${index}.registeredAddress.street2`}
          placeholder="Apt 4B"
        />
      </div>
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        console.log("Form submit event triggered");
        e.preventDefault();
        handleFormSubmit();
      }}
    >
      <FormCardTabs
        fields={fields}
        renderTabContent={renderTabContent}
        renderTabTitle={renderTabTitle}
        title="Company Owners & Representatives"
        onAdd={addUser}
        onCancel={onCancel}
        onRemove={removeUser}
        onSubmit={handleFormSubmit}
      />
    </form>
  );
};

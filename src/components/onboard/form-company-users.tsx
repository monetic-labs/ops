import React, { useEffect } from "react";
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
  walletAddressRegex,
} from "@/validations/onboard";

export const FormCompanyUsers: React.FC<{
  onSubmit: (data: CompanyRepresentativeSchema) => void;
  initialData: CompanyRepresentativeSchema;
  updateFormData: (data: CompanyRepresentativeSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CompanyRepresentativeSchema>({
    resolver: zodResolver(companyRepresentativeSchema),
    defaultValues: initialData,
  });

  const onCancel = () => router.push("/auth");

  useEffect(() => {
    const subscription = watch((value) => {
      updateFormData(value as CompanyRepresentativeSchema);
    });

    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "representatives",
  });

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
      walletAddress: "",
    });
  };

  const removeUser = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const renderTabContent = (field: any, index: number) => (
    <div className="space-y-4">
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[index]?.name?.message}
        label="Representative Name"
        maxLength={25}
        name={`representatives.${index}.name`}
        placeholder="Rick"
      />
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[index]?.surname?.message}
        label="Representative Surname"
        maxLength={25}
        name={`representatives.${index}.surname`}
        placeholder="Sanchez"
      />
      <FormInput
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
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[index]?.walletAddress?.message}
        label="Wallet Address"
        maxLength={42}
        name={`representatives.${index}.walletAddress`}
        pattern={walletAddressRegex.source}
        placeholder="0x1234567890123456789012345678901234567890"
      />
    </div>
  );

  const renderTabTitle = (field: any, index: number) => {
    const name = field.name || "";
    const surname = field.surname || "";

    return name || surname ? `${name} ${surname}`.trim() : `User ${index + 1}`;
  };

  return (
    <form onSubmit={handleFormSubmit}>
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

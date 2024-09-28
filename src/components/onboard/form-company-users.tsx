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
    </div>
  );

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

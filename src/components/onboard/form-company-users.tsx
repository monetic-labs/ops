import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";

import { FormCardTabs } from "@/components/generics/form-card-tabs";
import { FormInput } from "@/components/generics/form-input";

import { emailRegex } from "@/validations/auth";
import { companyRepresentativeSchema, CompanyRepresentativeSchema, phoneRegex, walletAddressRegex } from "@/validations/onboard";

export const FormCompanyUsers: React.FC<{ onSubmit: (data: CompanyRepresentativeSchema) => void }> = ({ onSubmit }) => {
    const router = useRouter();
    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm<CompanyRepresentativeSchema>({
      resolver: zodResolver(companyRepresentativeSchema),
      defaultValues: {
        representatives: [
          {
            name: "",
            surname: "",
            email: "",
            phoneNumber: "",
            walletAddress: "",
          },
        ],
      },
    });
  
    const { fields, append, remove } = useFieldArray({
      control,
      name: "representatives",
    });
  
    const handleFormSubmit = handleSubmit((data) => {
      console.log("Representatives submitted:", data);
      onSubmit(data);
    });

    const handleCancel = () => router.push("/auth");
  
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
          name={`representatives.${index}.name`}
          control={control}
          label="Representative Name"
          errorMessage={errors.representatives?.[index]?.name?.message}
          placeholder="Rick"
          maxLength={25}
        />
        <FormInput
          name={`representatives.${index}.surname`}
          control={control}
          label="Representative Surname"
          errorMessage={errors.representatives?.[index]?.surname?.message}
          placeholder="Sanchez"
          maxLength={25}
        />
        <FormInput
          name={`representatives.${index}.email`}
          control={control}
          label="Email"
          errorMessage={errors.representatives?.[index]?.email?.message}
          placeholder="nope@algersoft.com"
          pattern={emailRegex.source}
        />
        <FormInput
          name={`representatives.${index}.phoneNumber`}
          control={control}
          label="Phone Number"
          errorMessage={errors.representatives?.[index]?.phoneNumber?.message}
          placeholder="0701234567"
          pattern={phoneRegex.source}
        />
        <FormInput
          name={`representatives.${index}.walletAddress`}
          control={control}
          label="Wallet Address"
          errorMessage={errors.representatives?.[index]?.walletAddress?.message}
          placeholder="0x1234567890123456789012345678901234567890"
          maxLength={42}
          pattern={walletAddressRegex.source}
        />
      </div>
    );
  
    const renderTabTitle = (field: any, index: number) => {
        const name = field.name || '';
        const surname = field.surname || '';
        return name || surname ? `${name} ${surname}`.trim() : `User ${index + 1}`;
    };

    return (
      <form onSubmit={handleFormSubmit}>
        <FormCardTabs
          title="Company Users: Step 2"
          fields={fields}
          onAdd={addUser}
          onRemove={removeUser}
          renderTabContent={renderTabContent}
          renderTabTitle={renderTabTitle}
          onCancel={handleCancel}
          onSubmit={handleFormSubmit}
        />
      </form>
    );
  };
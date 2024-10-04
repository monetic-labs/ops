import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormCardTabs } from "@/components/generics/form-card-tabs";
import { FormInput } from "@/components/generics/form-input";
import { emailRegex } from "@/validations/auth";
import { addUserSchema, AddUserSchema, phoneRegex } from "@/validations/onboard";
import { FormCard } from "../generics/form-card";

export const FormCompanyUsers: React.FC<{
  onSubmit: (data: AddUserSchema) => void;
  initialData: AddUserSchema;
  updateFormData: (data: AddUserSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<AddUserSchema>({
    resolver: zodResolver(addUserSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = handleSubmit((data) => {
    console.log("User addition submitted:", data);
    onSubmit(data);
  });

  return (
    <form onSubmit={handleFormSubmit}>
      <FormCard title="Add Users">
        <FormInput
          control={control}
          errorMessage={errors.email?.message}
          label="Email"
          name="email"
          pattern={emailRegex.source}
          placeholder="user@example.com"
        />
        <FormInput
          control={control}
          errorMessage={errors.phoneNumber?.message}
          label="Phone Number"
          name="phoneNumber"
          pattern={phoneRegex.source}
          placeholder="0701234567"
        />
        <button type="submit">Add User</button>
      </FormCard>
    </form>
  );
};
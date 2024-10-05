import React, { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormCardTabs } from "@/components/generics/form-card-tabs";
import { FormInput } from "@/components/generics/form-input";
import { emailRegex } from "@/validations/auth";
import { addUserSchema, AddUserSchema, phoneRegex } from "@/validations/onboard";
import { useInviteUser } from "@/hooks/merchant/useInviteUser";

export const FormCompanyUsers: React.FC<{
  onSubmit: (data: AddUserSchema) => void;
  initialData: AddUserSchema;
  updateFormData: (data: AddUserSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm<AddUserSchema>({
    resolver: zodResolver(addUserSchema),
    defaultValues: initialData,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "users",
  });

  const { inviteUser, isLoading, error } = useInviteUser();

  useEffect(() => {
    const subscription = watch((value) => {
      updateFormData(value as AddUserSchema);
    });

    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

  const handleFormSubmit = handleSubmit(async (data) => {
    console.log("Users submitted:", data);
    for (const user of data) {
      await inviteUser(user);
    }
    onSubmit(data);
  });

  const addUser = () => {
    append({
      email: "",
      phoneNumber: "",
    });
  };

  const removeUser = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const renderTabTitle = (field: AddUserSchema, index: number) => {
    return field.email || `User ${index + 1}`;
  };

  const renderTabContent = (field: AddUserSchema, index: number) => (
    <div className="space-y-4">
      <FormInput
        control={control}
        errorMessage={errors.users?.[index]?.email?.message}
        label="Email"
        name={`users.${index}.email`}
        pattern={emailRegex.source}
        placeholder="user@example.com"
      />
      <FormInput
        control={control}
        errorMessage={errors.users?.[index]?.phoneNumber?.message}
        label="Phone Number"
        name={`users.${index}.phoneNumber`}
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
        title="Company Users"
        onAdd={addUser}
        onCancel={() => console.log("Cancel clicked")}
        onRemove={removeUser}
        onSubmit={handleFormSubmit}
      />
      {error && <p className="text-ualert-500">{error}</p>}  
    </form>
  );
};
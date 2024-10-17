import React, { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormCardTabs } from "@/components/generics/form-card-tabs";
import { FormInput } from "@/components/generics/form-input";
import { emailRegex } from "@/types/validations/auth";
import {
  companyAccountUsersSchema,
  phoneRegex,
} from "@/types/validations/onboard";

import { AutocompleteInput } from "../generics/autocomplete-input";
import { CompanyAccountUsersSchema } from "@/types/validations/onboard";
import { BridgeUserRole } from "@/types/dtos/bridgeDTO";
import { TabData } from "@/hooks/generics/useDynamicTabs";
import { useDynamicTabs } from "@/hooks/generics/useDynamicTabs";

const userRoles = [
  { label: "Owner", value: "owner" },
  { label: "Representative", value: "representative" },
  { label: "Beneficial Owner", value: "beneficial-owner" },
];

export const FormAccountUsers: React.FC<{
  onSubmit: (data: CompanyAccountUsersSchema) => void;
  initialData: CompanyAccountUsersSchema;
  updateFormData: (data: CompanyAccountUsersSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CompanyAccountUsersSchema>({
    resolver: zodResolver(companyAccountUsersSchema),
    defaultValues: initialData,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "representatives",
  });

  const renderTabTitle = (field: any, index: number) => {
    const firstName = field.firstName || "";
    const lastName = field.lastName || "";

    return firstName || lastName ? `${firstName} ${lastName}`.trim() : `User ${index + 1}`;
  };

  const initialTabs: TabData[] = fields.map((field, index) => ({
    key: `user-${index}`,
    title: renderTabTitle(field, index),
    isCompleted: false,
  }));

  const {
    tabs,
    activeTab,
    setActiveTab,
    updateTabCompletion,
    updateTabTitle,
    addTab,
    removeTabs,
  } = useDynamicTabs(initialTabs);
  
  const onCancel = () => router.push("/auth");

  useEffect(() => {
    const subscription = watch((value) => {
      updateFormData(value as CompanyAccountUsersSchema);
    });

    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);


  const handleFormSubmit = handleSubmit(
    (data) => {
      console.log("Representatives submitted:", data);
      onSubmit(data);
    },
    (errors) => {
      console.error("Form validation errors:", errors);
    }
  );

  useEffect(() => {
    if (fields.length === 0) {
      addUser();
    }
  }, [fields]);

  const addUser = () => {
    append({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      role: "representative",
      bridgeUserRole: BridgeUserRole.SUPER_ADMIN,
    });
    addTab({
      key: `user-${fields.length}`,
      title: `User ${fields.length + 1}`,
      isCompleted: false,
    });
  };

  const removeUser = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      removeTabs([`user-${index}`]);
    }
  };

  useEffect(() => {
    fields.forEach((field, index) => {
      updateTabTitle(`user-${index}`, renderTabTitle(field, index));
    });
  }, [fields, updateTabTitle]);

  const renderTabContent = (tab: TabData, index: number) => (
    <div className="space-y-4">
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[index]?.firstName?.message}
        label="First Name"
        maxLength={25}
        name={`representatives.${index}.firstName`}
        placeholder="Rick"
      />
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[index]?.lastName?.message}
        label="Last Name"
        maxLength={25}
        name={`representatives.${index}.lastName`}
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
      {index === 0 ? (
        <FormInput
          isReadOnly
          control={control}
          label="Role"
          name={`representatives.${index}.role`}
          value="Owner"
          disabled
        />
      ) : (
        <AutocompleteInput
          control={control}
          errorMessage={errors.representatives?.[index]?.role?.message}
          label="Role"
          name={`representatives.${index}.role`}
          placeholder="Select user role"
          items={userRoles}
          about="Select the role for this user"
          filterItems={(items) => items.filter((item) => item.value !== "owner")}
        />
      )}
      </div>
  );

  return (
    <form onSubmit={handleFormSubmit}>
      <FormCardTabs
        fields={tabs}
        renderTabContent={renderTabContent}
        renderTabTitle={(tab) => tab.title}
        title="Account Users"
        onAdd={addUser}
        onCancel={onCancel}
        onRemove={(index) => removeUser(index)}
        onSubmit={handleFormSubmit}
      />
    </form>
  );
};
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormCard } from "@/components/generics/form-card";
import { FormInput } from "@/components/generics/form-input";
import { FormButton } from "@/components/generics/form-button";
import { OwnerDetailsSchema, ownerDetailsSchema } from "@/validations/onboard";

export const FormOwnerDetails: React.FC<{
  onSubmit: (data: OwnerDetailsSchema) => void;
  initialData: OwnerDetailsSchema;
  updateFormData: (data: OwnerDetailsSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<OwnerDetailsSchema>({
    resolver: zodResolver(ownerDetailsSchema),
    defaultValues: initialData,
  });

  const onFormSubmit = handleSubmit((data: OwnerDetailsSchema) => {
    onSubmit(data);
    updateFormData(data);
  });

  return (
    <FormCard className="w-full" title="Owner Details">
      <form className="space-y-4" onSubmit={onFormSubmit}>
        <FormInput
          control={control}
          errorMessage={errors.role?.message}
          label="Role"
          name="role"
          placeholder="Select Role"
          type="autocomplete"
        />
        <FormInput
          control={control}
          errorMessage={errors.walletAddress?.message}
          label="Wallet Address"
          name="walletAddress"
          placeholder="0x1234567890123456789012345678901234567890"
        />
        <FormInput
          control={control}
          errorMessage={errors.birthday?.message}
          label="Birthday"
          name="birthday"
          placeholder="YYYY-MM-DD"
        />
        <FormInput
          control={control}
          errorMessage={errors.ssn?.message}
          label="Social Security"
          name="ssn"
          placeholder="123-45-6789"
        />
        <div className="flex justify-end space-x-4">
          <FormButton type="submit">Submit</FormButton>
        </div>
      </form>
    </FormCard>
  );
};
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tooltip } from "@nextui-org/tooltip";

import { FormModal } from "@/components/generics/form-modal";
import { FormInput } from "@/components/generics/form-input";
import {
  CompanyInfoSchema,
  companyRegisteredAddressSchema,
  CompanyRegisteredAddressSchema,
} from "@/validations/onboard";

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyRegisteredAddressSchema) => void;
  initialData?: Partial<CompanyRegisteredAddressSchema>;
}

export const AddressFormModal: React.FC<AddressFormModalProps> = ({ isOpen, onClose, onSubmit, initialData = {} }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CompanyRegisteredAddressSchema>({
    resolver: zodResolver(companyRegisteredAddressSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = (data: CompanyInfoSchema["company"]["registeredAddress"]) => {
    onSubmit(data);
    onClose();
  };

  return (
    <FormModal
      isOpen={isOpen}
      isValid={isValid}
      title="Address Details"
      onClose={onClose}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <Tooltip content="Street address is required">
        <FormInput
          control={control}
          errorMessage={errors.street1?.message}
          label="Street Address 1"
          maxLength={100}
          minLength={5}
          name="street1"
          placeholder="123 Epic St"
          required={true}
        />
      </Tooltip>
      <FormInput
        control={control}
        errorMessage={errors.street2?.message}
        label="Street Address 2 (Optional)"
        maxLength={100}
        minLength={5}
        name="street2"
        placeholder="Suite 420"
        required={false}
      />
      <FormInput
        control={control}
        errorMessage={errors.postcode?.message}
        label="Post Code"
        maxLength={5}
        minLength={5}
        name="postcode"
        placeholder="84101"
        required={true}
        onKeyDown={(e) => {
          if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
          }
        }}
      />
      <FormInput
        control={control}
        errorMessage={errors.city?.message}
        label="City"
        maxLength={5}
        name="city"
        placeholder="Salt Lake City"
        required={true}
        onKeyDown={(e) => {
          if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
          }
        }}
      />
      <FormInput
        control={control}
        errorMessage={errors.state?.message}
        label="State"
        maxLength={2}
        name="state"
        placeholder="UT"
        required={true}
        onKeyDown={(e) => {
          if (!/[A-Z]/.test(e.key)) {
            e.preventDefault();
            const newValue = e.currentTarget.value + e.key.toUpperCase();

            e.currentTarget.value = newValue;
          }
        }}
      />
      <FormInput
        control={control}
        errorMessage={errors.country?.message}
        label="Country"
        maxLength={2}
        name="country"
        placeholder="US"
        required={true}
        onKeyDown={(e) => {
          if (!/[A-Z]/.test(e.key)) {
            e.preventDefault();
            const newValue = e.currentTarget.value + e.key.toUpperCase();

            e.currentTarget.value = newValue;
          }
        }}
      />
    </FormModal>
  );
};

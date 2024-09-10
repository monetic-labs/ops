import React from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormModal } from "@/components/generics/form-modal";
import { FormInput } from "@/components/generics/form-input";
import { CompanyInfoSchema, companyRegisteredAddressSchema, CompanyRegisteredAddressSchema } from "@/validations/onboard";
import { Tooltip } from "@nextui-org/tooltip";

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyRegisteredAddressSchema) => void;
  initialData?: Partial<CompanyRegisteredAddressSchema>;
}

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
}) => {
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
      onClose={onClose}
      title="Address Details"
      onSubmit={handleSubmit(handleFormSubmit)}
      isValid={isValid}
    >
      <Tooltip content="Street address is required">
        <FormInput
          name="street1"
          control={control}
          label="Street Address 1"
          errorMessage={errors.street1?.message}
          placeholder="123 Epic St"
          maxLength={100}
          minLength={5}
          required={true}
        />
      </Tooltip>
      <FormInput
        name="street2"
        control={control}
        label="Street Address 2 (Optional)"
        errorMessage={errors.street2?.message}
        placeholder="Suite 420"
        maxLength={100}
        minLength={5}
        required={false}
      />
      <FormInput
        name="postcode"
        control={control}
        label="Post Code"
        errorMessage={errors.postcode?.message}
        placeholder="84101" 
        maxLength={5}
        minLength={5}
        required={true}
        onKeyDown={(e) => {
          if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
          }
        }}
      />
      <FormInput
        name="city"
        control={control}
        label="City"
        errorMessage={errors.city?.message}
        placeholder="Salt Lake City"
        required={true}
        maxLength={5}
        onKeyDown={(e) => {
          if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
          }
        }}
      />
      <FormInput
        name="state"
        control={control}
        label="State"
        errorMessage={errors.state?.message}
        placeholder="UT"
        maxLength={2}
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
        name="country"
        control={control}
        label="Country"
        errorMessage={errors.country?.message}
        placeholder="US"
        required={true}
        maxLength={2}
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
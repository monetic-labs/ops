import React from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";

import { Controller, Control, FieldErrors } from "react-hook-form";

import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

import { MerchantFormData } from "@/validations/merchant";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  control: Control<MerchantFormData>;
  errors: FieldErrors<MerchantFormData>;
  defaultValues: {
    city: string;
    state: string;
    postcode: string;
    country: ISO3166Alpha2Country;
  };
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  control,
  errors,
  defaultValues,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Complete Address</ModalHeader>
        <ModalBody>
          <Controller
            control={control}
            name="company.registeredAddress.street1"
            render={({ field }) => (
              <Input
                {...field}
                errorMessage={errors.company?.registeredAddress?.street1?.message}
                isInvalid={!!errors.company?.registeredAddress?.street1}
                label="Street Address"
                placeholder="123 Epic St"
              />
            )}
            rules={{ required: "Street address is required" }}
          />
          <Controller
            control={control}
            name="company.registeredAddress.street2"
            render={({ field }) => (
              <Input
                {...field}
                errorMessage={errors.company?.registeredAddress?.street2?.message}
                isInvalid={!!errors.company?.registeredAddress?.street2}
                label="Street Address Line 2"
                placeholder="Unit B 420"
              />
            )}
          />
          <Controller
            control={control}
            defaultValue={defaultValues.city}
            name="company.registeredAddress.city"
            render={({ field }) => <Input {...field} isReadOnly label="City" />}
          />
          <Controller
            control={control}
            defaultValue={defaultValues.state}
            name="company.registeredAddress.state"
            render={({ field }) => (
              <Input
                {...field}
                isReadOnly
                label="State"
                maxLength={2} // Restrict to 2 characters
                placeholder="WA"
              />
            )}
            rules={{ required: "State is required", maxLength: 2 }}
          />
          <Controller
            control={control}
            defaultValue={defaultValues.postcode}
            name="company.registeredAddress.postcode"
            render={({ field }) => <Input {...field} isReadOnly label="Postal Code" placeholder="98101" />}
          />
          <Controller
            control={control}
            defaultValue={defaultValues.country}
            name="company.registeredAddress.country"
            render={({ field }) => (
              <Input
                {...field}
                errorMessage={errors.company?.registeredAddress?.country?.message}
                isInvalid={!!errors.company?.registeredAddress?.country}
                isReadOnly
                label="Country"
                placeholder="US"
              />
            )}
            rules={{ required: "Country is required", pattern: /^[A-Z]{2}$/ }}
          />
        </ModalBody>
        <ModalFooter>
          <Button className="text-notpurple-500" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button className="bg-ualert-500" onPress={onConfirm}>
            Confirm Address
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Controller, Control } from "react-hook-form";

import { MerchantFormData } from "@/data/merchant";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  control: Control<MerchantFormData>;
  errors: any;
  defaultValues: {
    city: string;
    state: string;
    postcode: string;
    country: string;
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
            name="company.mailingAddress.street1"
            render={({ field }) => (
              <Input
                {...field}
                errorMessage={errors.company?.mailingAddress?.street1?.message}
                isInvalid={!!errors.company?.mailingAddress?.street1}
                label="Street Address"
                placeholder="Enter street address"
              />
            )}
            rules={{ required: "Street address is required" }}
          />
          <Controller
            control={control}
            name="company.mailingAddress.street2"
            render={({ field }) => (
              <Input
                {...field}
                errorMessage={errors.company?.mailingAddress?.street2?.message}
                isInvalid={!!errors.company?.mailingAddress?.street2}
                label="Street Address Line 2"
                placeholder="Enter street address"
              />
            )}
            rules={{ required: "Street address is required" }}
          />
          <Controller
            control={control}
            defaultValue={defaultValues.city}
            name="company.mailingAddress.city"
            render={({ field }) => <Input {...field} isReadOnly label="City" />}
          />
          <Controller
            control={control}
            defaultValue={defaultValues.state}
            name="company.mailingAddress.state"
            render={({ field }) => (
              <Input {...field} isReadOnly label="State" />
            )}
          />
          <Controller
            control={control}
            defaultValue={defaultValues.postcode}
            name="company.mailingAddress.postcode"
            render={({ field }) => (
              <Input {...field} isReadOnly label="Postal Code" />
            )}
          />
          <Controller
            control={control}
            defaultValue={defaultValues.country}
            name="company.mailingAddress.country"
            render={({ field }) => (
              <Input
                {...field}
                errorMessage={errors.company?.mailingAddress?.country?.message}
                isInvalid={!!errors.company?.mailingAddress?.country}
                label="Country"
              />
            )}
            rules={{ required: "Country is required" }}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            className="text-notpurple-500"
            variant="light"
            onPress={onClose}
          >
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

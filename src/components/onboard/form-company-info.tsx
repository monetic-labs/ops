import React from "react";
import { Controller, useWatch } from "react-hook-form";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";
import { AddressModal } from "./address-modal";

interface CompanyInfoProps {
  control: any;
  errors: any;
  handleZipCodeLookup: (zipCode: string) => void;
  addressLookup: any;
  isAddressModalOpen: boolean;
  setIsAddressModalOpen: (isOpen: boolean) => void;
  handleCancel: () => void;
  onSubmitStep: (step: number) => void;
  initialEmail: string;
  watch: any;
}

export const CompanyInfo: React.FC<CompanyInfoProps> = ({
  control,
  errors,
  handleZipCodeLookup,
  addressLookup,
  isAddressModalOpen,
  setIsAddressModalOpen,
  handleCancel,
  onSubmitStep,
  initialEmail,
  watch
}) => {
  const watchedFields = useWatch({
    control,
    name: ["company.name", "company.email", "company.mailingAddress.postcode", "company.settlementAddress"],
  });

  const isStep1Complete = watchedFields.every(field => field && field.trim() !== "");
  
  return (
    <div className="space-y-4">
    <Controller
      control={control}
      name="company.name"
      render={({ field }) => (
        <Tooltip
          className="tooltip-left-align"
          content="Official registered name of your company (e.g., Acme Corporation)"
        >
          <Input
            {...field}
            errorMessage={errors.company?.name?.message}
            isInvalid={!!errors.company?.name}
            label="Company Name"
            placeholder="Enter company name"
          />
        </Tooltip>
      )}
      rules={{ required: "Company name is required" }}
    />
    <Controller
      control={control}
      name="company.email"
      render={({ field }) => (
        <Tooltip
          className="tooltip-left-align"
          content="Official email address for business communications (e.g., info@acmecorp.com)"
        >
          <Input
            {...field}
            errorMessage={errors.company?.email?.message}
            isInvalid={!!errors.company?.email}
            label="Company Email"
            placeholder="Enter company email"
            defaultValue={initialEmail}
          />
        </Tooltip>
      )}
      rules={{
        required: "Company email is required",
        pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
      }}
    />
    <Controller
      control={control}
      name="company.mailingAddress.postcode"
      render={({ field }) => (
        <Tooltip className="tooltip-left-align" content="5-digit ZIP code for US addresses (e.g., 90210)">
          <Input
            {...field}
            errorMessage={errors.company?.mailingAddress?.postcode?.message}
            isInvalid={!!errors.company?.mailingAddress?.postcode}
            label="Postal Code"
            placeholder="Enter postal code"
            onChange={(e) => {
              field.onChange(e);
              handleZipCodeLookup(e.target.value);
            }}
          />
        </Tooltip>
      )}
      rules={{ required: "Postal code is required" }}
    />
    <Controller
      control={control}
      name="company.settlementAddress"
      render={({ field }) => (
        <Tooltip
          className="tooltip-left-align"
          content="Full address where payments will be settled (e.g., 123 Main St, Anytown, CA 90210)"
        >
          <Input
            {...field}
            errorMessage={errors.company?.settlementAddress?.message}
            isInvalid={!!errors.company?.settlementAddress}
            label="Settlement Address"
            placeholder="Enter settlement address"
          />
        </Tooltip>
      )}
      rules={{ required: "Settlement address is required" }}
    />
    <AddressModal
      control={control}
      defaultValues={addressLookup || { city: "", state: "", postcode: "", country: "" }}
      errors={errors}
      isOpen={isAddressModalOpen}
      onClose={() => setIsAddressModalOpen(false)}
      onConfirm={() => {
        setIsAddressModalOpen(false);
        // You might want to trigger form validation here
      }}
    />
    <div className="flex justify-between mt-4">
      <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
        Cancel
      </Button>
      <Button
        className={`bg-ualert-500 ${!isStep1Complete ? "button-disabled" : ""}`}
        disabled={!isStep1Complete}
        onClick={() => onSubmitStep(1)}
      >
        Step 1: Submit Company Info
      </Button>
      </div>
    </div>
  );
};
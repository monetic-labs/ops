import React from "react";
import { Control, Controller, FieldErrors, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";

import { emailRegex } from "@/validations/auth";
import { MerchantFormData, merchantCreateSchema } from "@/validations/merchant";

import { AddressModal } from "./address-modal";

interface CompanyInfoProps {
  control: Control<MerchantFormData>;
  errors: FieldErrors<MerchantFormData>;
  handleZipCodeLookup: (zipCode: string) => void;
  addressLookup: any;
  isAddressModalOpen: boolean;
  setIsAddressModalOpen: (isOpen: boolean) => void;
  handleCancel: () => void;
  onSubmitStep: (step: number) => void;
  initialEmail: string;
}

export const CompanyInfo: React.FC<CompanyInfoProps> = ({
  //control,
  // errors,
  handleZipCodeLookup,
  addressLookup,
  isAddressModalOpen,
  setIsAddressModalOpen,
  handleCancel,
  onSubmitStep,
  initialEmail,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<MerchantFormData>({
    resolver: zodResolver(merchantCreateSchema),
    mode: "onChange",
    defaultValues: {
      company: {
        email: initialEmail,
      },
    },
  });

  const watchedFields = watch(["company.name", "company.email", "company.registeredAddress.postcode", "walletAddress"]);
  const isStep1Complete = watchedFields.every((field) => field && field.trim() !== "");
  console.log("isStep1Complete", isStep1Complete);
  console.log("watchedFields", watchedFields);

  const onSubmit = (data: MerchantFormData) => {
    console.log("Form submitted with data:", data);
    if (isValid) {
      console.log("Calling onSubmitStep(1)");
      onSubmitStep(1);
    } else {
      console.error("Form submitted with invalid data:", errors);
    }
  };

  console.log("rendering company info");
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        control={control}
        name="company.name"
        render={({ field }) => (
          <Tooltip
            className="tooltip-left-align"
            content="Use your registered LLC or S-Corp name, even if you dba under a different name"
          >
            <Input
              {...field}
              errorMessage={errors.company?.name?.message}
              isInvalid={!!errors.company?.name}
              label="Company Name"
              placeholder="Figgis Agency LLC"
              maxLength={50} //soft limit -> see absolute limit in validation
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
            content="This is the email you want company communications sent to, including important notifications and account updates"
          >
            <Input
              {...field}
              defaultValue={initialEmail}
              errorMessage={errors.company?.email?.message}
              isInvalid={!!errors.company?.email}
              label="Company Email"
              placeholder="dick@figgisagency.xyz"
              maxLength={50} //soft limit -> see absolute limit in validation
            />
          </Tooltip>
        )}
        rules={{
          required: "Company email is required",
          pattern: { value: emailRegex, message: "Invalid email address" },
        }}
      />
      <Controller
        control={control}
        name="company.registeredAddress.postcode"
        render={({ field }) => (
          <Tooltip className="tooltip-left-align" content="5-digit ZIP code for US addresses (e.g., 90210)">
            <Input
              {...field}
              errorMessage={errors.company?.registeredAddress?.postcode?.message}
              isInvalid={!!errors.company?.registeredAddress?.postcode}
              label="Postal Code"
              placeholder="10001"
              maxLength={5}
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
        name="walletAddress"
        render={({ field }) => (
          <Tooltip
            className="tooltip-left-align"
            content="This is an ethereum style 0x address and where your funds will be settled"
          >
            <Input
              {...field}
              errorMessage={errors.walletAddress?.message}
              isInvalid={!!errors.walletAddress}
              label="Settlement Address"
              placeholder="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
              maxLength={42}
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
        }}
      />
      <div className="flex justify-between mt-4">
        <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className={`bg-ualert-500 ${!isStep1Complete ? "button-disabled" : ""}`}
          disabled={!isStep1Complete}
          onClick={() => {
            onSubmitStep(1);
            console.log("isStep1Complete", isStep1Complete);
          }}
        >
          Step 1: Submit Company Info
        </Button>
      </div>
    </form>
  );
};

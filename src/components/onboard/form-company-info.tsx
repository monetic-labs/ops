import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/button";

import { FormCard } from "@/components/generics/form-card";
import { FormInput } from "@/components/generics/form-input";
import { FormButton } from "@/components/generics/form-button";
import { CompanyInfoSchema, companyInfoSchema, walletAddressRegex } from "@/validations/onboard";
import { emailRegex } from "@/validations/auth";

import { PostcodeInput } from "../generics/form-input-postcode";

export const FormCompanyInfo: React.FC<{
  onSubmit: (data: CompanyInfoSchema) => void;
  initialData: CompanyInfoSchema;
  updateFormData: (data: CompanyInfoSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  const router = useRouter();
  const [showAddressInputs, setShowAddressInputs] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
  } = useForm<CompanyInfoSchema>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: initialData,
  });

  const onCancel = () => router.push("/auth");

  const watchPostcode = watch("company.registeredAddress.postcode");

  useEffect(() => {
    if (watchPostcode && watchPostcode.length === 5) {
      setShowAddressInputs(true);
    } else {
      setShowAddressInputs(false);
    }
  }, [watchPostcode]);

  useEffect(() => {
    const subscription = watch((value) => {
      updateFormData(value as CompanyInfoSchema);
    });

    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

  const onFormSubmit = handleSubmit(
    (data: CompanyInfoSchema) => {
      onSubmit(data);
      updateFormData(data);
    },
    (errors) => {
      console.log("Submission errors:", errors);
    }
  );

  const onPostcodeLookup = (result: any) => {
    if (result) {
      setValue("company.registeredAddress.postcode", result.postcode, { shouldValidate: true });
      setValue("company.registeredAddress.city", result.city, { shouldValidate: true });
      setValue("company.registeredAddress.state", result.state, { shouldValidate: true });
      setShowAddressInputs(true);
    } else {
      setShowAddressInputs(false);
    }
    console.log("Postcode lookup result:", result);
  };

  return (
    <FormCard className="w-full" title="Company Information">
      <form className="space-y-4" onSubmit={onFormSubmit}>
        <FormInput
          control={control}
          errorMessage={errors.company?.name?.message}
          label="Company Name"
          maxLength={50}
          name="company.name"
          placeholder="Algersoft, LLC"
        />
        <FormInput
          control={control}
          errorMessage={errors.company?.email?.message}
          label="Email"
          name="company.email"
          pattern={emailRegex.source}
          placeholder="nope@algersoft.com"
        />
        <FormInput
          control={control}
          errorMessage={errors.walletAddress?.message}
          label="Wallet Address"
          maxLength={42}
          name="walletAddress"
          pattern={walletAddressRegex.source}
          placeholder="0x1234567890123456789012345678901234567890"
        />
        {/* Go to postcode input component for more prop controls */}
        <PostcodeInput
          control={control}
          errorMessage={errors.company?.registeredAddress?.postcode?.message}
          name="company.registeredAddress.postcode"
          showAddressInputs={showAddressInputs}
          onLookupComplete={onPostcodeLookup}
        />
        <div className={`fade-in ${showAddressInputs ? "show" : ""}`}>
          <FormInput
            control={control}
            errorMessage={errors.company?.registeredAddress?.street1?.message}
            label="Street Address 1"
            name="company.registeredAddress.street1"
            placeholder="123 Main St"
          />
        </div>
        <div className={`fade-in ${showAddressInputs ? "show" : ""}`}>
          <FormInput
            control={control}
            errorMessage={errors.company?.registeredAddress?.street2?.message}
            label="Street Address 2"
            name="company.registeredAddress.street2"
            placeholder="Apt 4B"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <Button className="text-notpurple-500" variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <FormButton type="submit">Submit</FormButton>
        </div>
      </form>
    </FormCard>
  );
};
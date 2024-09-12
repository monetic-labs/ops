import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { FormCard } from "@/components/generics/form-card";
import { FormInput } from "@/components/generics/form-input";
import { FormButton } from "@/components/generics/form-button";

import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

import { CompanyInfoSchema, companyInfoSchema, postcodeRegex, walletAddressRegex } from "@/validations/onboard";
import { emailRegex } from "@/validations/auth";

import { PostcodeInput } from "../generics/form-input-postcode";
import { Button } from "@nextui-org/button";

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
    defaultValues: {
      company: {
        name: "",
        email: "",
        registeredAddress: {
          street1: "",
          street2: "",
          city: "",
          postcode: "",
          state: "",
          country: "US" as ISO3166Alpha2Country,
        },
      },
      walletAddress: "",
    },
  });

  const watchPostcode = watch("company.registeredAddress.postcode");
  useEffect(() => {
    if (watchPostcode && watchPostcode.length === 5) {
      setShowAddressInputs(true);
    } else {
      setShowAddressInputs(false);
    }
  }, [watchPostcode]);

  const onCancel = () => {
    router.push("/");
  };

  const onFormSubmit = handleSubmit(
    (data: CompanyInfoSchema) => {
      console.log("Form data submitted:", data);
      onSubmit(data);
      updateFormData(data);
    },
    (errors) => {
      console.log("Submission errors:", errors);
    }
  );

  useEffect(() => {
    const subscription = watch((value) => {
      console.log("Form data updated:", value);
      updateFormData(value as CompanyInfoSchema);
    });
    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

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
    <FormCard title="Company Information" className="w-full">
      <form onSubmit={onFormSubmit} className="space-y-4">
        <FormInput
          name="company.name"
          control={control}
          label="Company Name"
          errorMessage={errors.company?.name?.message}
          placeholder="Algersoft, LLC"
          maxLength={50}
        />
        <FormInput
          name="company.email"
          control={control}
          label="Email"
          errorMessage={errors.company?.email?.message}
          placeholder="nope@algersoft.com"
          pattern={emailRegex.source}
        />
        <FormInput
          name="walletAddress"
          control={control}
          label="Wallet Address"
          errorMessage={errors.walletAddress?.message}
          placeholder="0x1234567890123456789012345678901234567890"
          maxLength={42}
          pattern={walletAddressRegex.source}
        />
        {/* Go to postcode input component for more prop controls */}
        <PostcodeInput
          name="company.registeredAddress.postcode"
          control={control}
          errorMessage={errors.company?.registeredAddress?.postcode?.message}
          onLookupComplete={onPostcodeLookup}
          showAddressInputs={showAddressInputs}
        />
        <div className={`fade-in ${showAddressInputs ? 'show' : ''}`}>
          <FormInput
            name="company.registeredAddress.street1"
            control={control}
            label="Street Address 1"
            placeholder="123 Main St"
            errorMessage={errors.company?.registeredAddress?.street1?.message}
          />
        </div>
        <div className={`fade-in ${showAddressInputs ? 'show' : ''}`}>
          <FormInput
            name="company.registeredAddress.street2"
            control={control}
            label="Street Address 2"
            placeholder="Apt 4B"
            errorMessage={errors.company?.registeredAddress?.street2?.message}
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
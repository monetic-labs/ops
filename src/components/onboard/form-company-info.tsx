import React, { useState } from "react";
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


export const FormCompanyInfo: React.FC = () => {
  const router = useRouter();
  const [showAddressInputs, setShowAddressInputs] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
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

  const onSubmit = (data: CompanyInfoSchema) => {
    console.log("Form data submitted:", data);
    // Handle form submission
  };

  const onPostcodeLookup = (result: any) => {
    if (result) {
    setValue("company.registeredAddress.postcode", result.postcode);
    setValue("company.registeredAddress.city", result.city);
    setValue("company.registeredAddress.state", result.state);
    setShowAddressInputs(true);
  } else {
      setShowAddressInputs(false);
    }
  };

  return (
    <FormCard title="Onboard Company Step 1">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <FormButton onClick={() => router.push("/auth")} type="button">Cancel</FormButton>
          <FormButton type="submit">Submit</FormButton>
        </div>
      </form>
    </FormCard>
  );
};
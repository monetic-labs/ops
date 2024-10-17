import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/button";

import { FormCard } from "@/components/generics/form-card";
import { FormInput } from "@/components/generics/form-input";
import { FormButton } from "@/components/generics/form-button";
import { CompanyAccountSchema, companyAccountSchema } from "@/types/validations/onboard";
import { emailRegex } from "@/types/validations/auth";

import { PostcodeInput } from "../generics/form-input-postcode";

export const FormCompanyInfo: React.FC<{
  onSubmit: (data: CompanyAccountSchema) => void;
  initialData: CompanyAccountSchema;
  updateFormData: (data: CompanyAccountSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  const router = useRouter();
  const [showAddressInputs, setShowAddressInputs] = useState(false);
  const [websiteInput, setWebsiteInput] = useState(initialData.company.website || "");
  
  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
  } = useForm<CompanyAccountSchema>({
    resolver: zodResolver(companyAccountSchema),
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
      updateFormData(value as CompanyAccountSchema);
    });

    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

  const onFormSubmit = handleSubmit(
    (data: CompanyAccountSchema) => {
      console.log("data", data);
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
      setValue("company.registeredAddress.country", result.country, { shouldValidate: true });
      setShowAddressInputs(true);
    } else {
      setShowAddressInputs(false);
    }
  };

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setWebsiteInput(value);

    // Add https:// if not present when setting the form value
    if (value && !value.startsWith("http://") && !value.startsWith("https://")) {
      value = `https://${value}`;
    }

    setValue("company.website", value, { shouldValidate: true });
  };

  return (
    <FormCard className="w-full" title="Company Account">
      <form className="space-y-4" onSubmit={onFormSubmit}>
        <FormInput
          about="Use the registered name of the company, your dba can be updated later."
          control={control}
          errorMessage={errors.company?.name?.message}
          label="Company Name"
          maxLength={50}
          name="company.name"
          placeholder="Algersoft, LLC"
        />
        <FormInput
          about="Use the email where you want to receive important account notifications."
          control={control}
          errorMessage={errors.company?.email?.message}
          label="Email"
          name="company.email"
          pattern={emailRegex.source}
          placeholder="nope@algersoft.com"
        />
        <FormInput
          about="You don't need to add the http:// or https:// before the url."
          control={control}
          errorMessage={errors.company?.website?.message}
          label="Website"
          name="company.website"
          placeholder="algersoft.com"
          value={websiteInput}
          onChange={handleWebsiteChange}
        />
        <PostcodeInput
          about="Address where the company is registered."
          control={control}
          errorMessage={errors.company?.registeredAddress?.postcode?.message}
          name="company.registeredAddress.postcode"
          showAddressInputs={showAddressInputs}
          onLookupComplete={onPostcodeLookup}
          watchPostcode={watchPostcode}
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
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
import {
  handleEmailChange,
  handlePostcodeLookup,
  handleWebsiteChange,
  PostcodeLookupResult,
} from "../generics/form-input-handlers";

export const FormCompanyInfo: React.FC<{
  onSubmit: (data: CompanyAccountSchema) => void;
  initialData: CompanyAccountSchema;
  updateFormData: (data: CompanyAccountSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState(initialData.company.email || "");
  const [websiteInput, setWebsiteInput] = useState(
    initialData.company.website.replace("https://", "").replace("http://", "") || ""
  );
  const [showAddressInputs, setShowAddressInputs] = useState(false);

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
      console.log("FormCompanyInfo data", data);
      onSubmit(data);
      updateFormData(data);
    },
    (errors) => {
      console.log("Submission errors:", errors);
    }
  );

  const onPostcodeLookup = (result: PostcodeLookupResult | null) => {
    handlePostcodeLookup(result, setValue, setShowAddressInputs, "company.registeredAddress");
  };

  return (
    <FormCard className="w-full" data-testid="company-account-form" title="Company Account">
      <form className="space-y-4" onSubmit={onFormSubmit}>
        <FormInput
          about="Use the registered name of the company, your dba can be updated later."
          control={control}
          data-testid="company-account-name-input"
          errorMessage={errors.company?.name?.message}
          label="Company Name"
          maxLength={50}
          name="company.name"
          placeholder="Algersoft"
        />
        <FormInput
          about="Use the email where you want to receive important account notifications."
          control={control}
          data-testid="company-account-email-input"
          errorMessage={errors.company?.email?.message}
          label="Email"
          name="company.email"
          pattern={emailRegex.source}
          placeholder="nope@algersoft.com"
          value={emailInput}
          onChange={(e) =>
            handleEmailChange(
              e,
              setValue,
              (value) => {
                setEmailInput(value as string);
              },
              "company.email"
            )
          }
        />
        <FormInput
          control={control}
          data-testid="company-account-website-input"
          errorMessage={errors.company?.website?.message}
          label="Website"
          name="company.website"
          placeholder="algersoft.com"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">https://</span>
            </div>
          }
          type="url"
          value={websiteInput.replace("https://", "").replace("http://", "")}
          onChange={(e) =>
            handleWebsiteChange(
              e,
              setValue,
              (value) => {
                setWebsiteInput(value as string);
              },
              "company.website"
            )
          }
        />
        <PostcodeInput
          about="Address where the company is registered."
          control={control}
          errorMessage={errors.company?.registeredAddress?.postcode?.message}
          name="company.registeredAddress.postcode"
          showAddressInputs={showAddressInputs}
          testId="company-account-postcode-input"
          watchPostcode={watchPostcode}
          onLookupComplete={onPostcodeLookup}
        />
        <div className={`fade-in ${showAddressInputs ? "show" : ""}`}>
          <FormInput
            control={control}
            data-testid="company-account-street-address-1-input"
            errorMessage={errors.company?.registeredAddress?.street1?.message}
            label="Street Address 1"
            name="company.registeredAddress.street1"
            placeholder="123 Main St"
          />
        </div>
        <div className={`fade-in ${showAddressInputs ? "show" : ""}`}>
          <FormInput
            control={control}
            data-testid="company-account-street-address-2-input"
            errorMessage={errors.company?.registeredAddress?.street2?.message}
            label="Street Address 2"
            name="company.registeredAddress.street2"
            placeholder="Apt 4B"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <Button className="text-notpurple-500" variant="light" onPress={onCancel}>
            Cancel
          </Button>
          <FormButton data-testid="company-account-submit-button" type="submit" onPress={() => onFormSubmit()}>
            Submit
          </FormButton>
        </div>
      </form>
    </FormCard>
  );
};

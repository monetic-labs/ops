import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormCardTabs } from "@/components/generics/form-card-tabs";
import { FormInput } from "@/components/generics/form-input";
import { emailRegex } from "@/validations/auth";
import {
  companyRepresentativeSchema,
  CompanyRepresentativeSchema,
  phoneRegex,
} from "@/validations/onboard";
import { PostcodeInput } from "../generics/form-input-postcode";
import { FormCard } from "../generics/form-card";
import { FormButton } from "../generics/form-button";
import { Button } from "@nextui-org/button";

export const FormCompanyOwner: React.FC<{
  onSubmit: (data: CompanyRepresentativeSchema) => void;
  initialData: CompanyRepresentativeSchema;
  updateFormData: (data: CompanyRepresentativeSchema) => void;
}> = ({ onSubmit, initialData, updateFormData }) => {
  
  const router = useRouter();
  const [showAddressInputs, setShowAddressInputs] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CompanyRepresentativeSchema>({
    resolver: zodResolver(companyRepresentativeSchema),
    defaultValues: initialData,
  });

  const onCancel = () => router.push("/auth");

  const watchPostcode = watch("representatives.0.registeredAddress.postcode");

  useEffect(() => {
    if (watchPostcode && watchPostcode.length === 5) {
      setShowAddressInputs(true);
    } else {
      setShowAddressInputs(false);
    }
  }, [watchPostcode]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name) {
        console.log("user form data", value);
        updateFormData(value as CompanyRepresentativeSchema);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, updateFormData]);

  const handleFormSubmit = handleSubmit((data) => {
    console.log("Representatives submitted:", data);
    onSubmit(data);
  });

  return (
    <FormCard title="Account Owner">
        <form
          onSubmit={(e) => {
            console.log("Form submit event triggered");
            e.preventDefault();
            handleFormSubmit();
          }}
        >
        <div className="space-y-4">
          <FormInput
            control={control}
            errorMessage={errors.representatives?.[0]?.firstName?.message}
            label="First Name"
            maxLength={25}
            name="representatives.0.firstName"
            placeholder="Rick"
          />
          <FormInput
            control={control}
            errorMessage={errors.representatives?.[0]?.lastName?.message}
            label="Last Name"
            maxLength={25}
            name="representatives.0.lastName"
            placeholder="Sanchez"
          />
          <FormInput
            about="Use the email for the primary contact for this company."
            control={control}
            errorMessage={errors.representatives?.[0]?.email?.message}
            label="Email"
            name="representatives.0.email"
            pattern={emailRegex.source}
            placeholder="nope@algersoft.com"
          />
          <FormInput
            control={control}
            errorMessage={errors.representatives?.[0]?.phoneNumber?.message}
            label="Phone Number"
            name="representatives.0.phoneNumber"
            pattern={phoneRegex.source}
            placeholder="0701234567"
          />
          <PostcodeInput
            control={control}
            errorMessage={errors.representatives?.[0]?.registeredAddress?.postcode?.message}
            name="representatives.0.registeredAddress.postcode"
            showAddressInputs={showAddressInputs}
            onLookupComplete={(result) => {
              if (result) {
                setValue("representatives.0.registeredAddress.postcode", result.postcode, { shouldValidate: true });
                setValue("representatives.0.registeredAddress.city", result.city, { shouldValidate: true });
                setValue("representatives.0.registeredAddress.state", result.state, { shouldValidate: true });
                setShowAddressInputs(true);
              } else {
                setShowAddressInputs(false);
              }
              console.log("Postcode lookup result:", result);
            }}
          />
          <div className={`fade-in ${showAddressInputs ? "show" : ""}`}>
            <FormInput
              control={control}
              errorMessage={errors.representatives?.[0]?.registeredAddress?.street1?.message}
              label="Street Address 1"
              name="representatives.0.registeredAddress.street1"
              placeholder="123 Main St"
            />
          </div>
          <div className={`fade-in ${showAddressInputs ? "show" : ""}`}>
            <FormInput
              control={control}
              errorMessage={errors.representatives?.[0]?.registeredAddress?.street2?.message}
              label="Street Address 2"
              name="representatives.0.registeredAddress.street2"
              placeholder="Apt 4B"
            />
          </div>
          <div className="flex justify-end space-x-4">
          <Button className="text-notpurple-500" variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <FormButton type="submit">Submit</FormButton>
        </div>
        </div>
    </form>
      </FormCard>
  );
};
"use client";

import React from "react";
import { Tabs, Tab } from "@nextui-org/tabs";

import { FormCard } from "@/components/generics/form-card";
import { useMerchantForm } from "@/hooks/merchant/useMerchantForm";

import { CompanyInfo } from "./form-company-info";
import { CompanyOwner } from "./form-company-owners";

import { Documents } from "./form-documents";
import { MerchantFormData } from "@/validations/onboard";
import { Control, FieldErrors } from "react-hook-form";
import { Review } from "./form-review";

export const KYBMerchantForm: React.FC<{ onCancel: () => void; initialEmail: string }> = ({ initialEmail }) => {

  const {
    activeTab,
    setActiveTab,
    stepCompletion,
    control,
    errors,
    fields,
    append,
    remove,

    handleZipCodeLookup,
    addressLookup,

    isAddressModalOpen,
    setIsAddressModalOpen,
    
    handleCancel,
    onSubmitStep,

    createMerchantData,
    formKey,
  } = useMerchantForm(initialEmail);

  const handleEditStep = (step: string) => {
    setActiveTab(step);
  };

  return (
    <FormCard className="overflow-y-auto max-h-screen" title="KYB Merchant Onboarding">
      <Tabs key={formKey} selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="company-info" title="Company Info">
          <CompanyInfo
            addressLookup={addressLookup}
            control={control as Control<MerchantFormData>}
            errors={errors as FieldErrors<MerchantFormData>}
            handleCancel={handleCancel}
            handleZipCodeLookup={handleZipCodeLookup}
            initialEmail={initialEmail}
            isAddressModalOpen={isAddressModalOpen}
            setIsAddressModalOpen={setIsAddressModalOpen}
            onSubmitStep={onSubmitStep}
          />
        </Tab>
        <Tab key="company-owner" title="Company Owner">
          <CompanyOwner
            append={append as () => void}
            control={control as Control<MerchantFormData>}
            errors={errors as FieldErrors<MerchantFormData>}
            fields={fields}
            handleCancel={handleCancel}
            initialEmail={initialEmail}
            remove={remove}
            stepCompletion={stepCompletion}
            onSubmitStep={onSubmitStep}
          />
        </Tab>
        <Tab key="review" title="Review">
          <Review
            data={control._formValues as MerchantFormData}
            onSubmit={() => onSubmitStep(2)}
            onEdit={handleEditStep}
          />
        </Tab>
        <Tab key="documents" title="Documents">
          <Documents
            handleCancel={handleCancel}
            stepCompletion={stepCompletion}
            merchantResponse={createMerchantData}
            onSubmitStep={onSubmitStep}
          />
        </Tab>
      </Tabs>
    </FormCard>
  );
};

"use client";

import React from "react";
import { Tabs, Tab } from "@nextui-org/tabs";

import { FormCard } from "@/components/generics/form-card";
import { useMerchantForm } from "@/hooks/merchant/useMerchantForm";

import { Documents } from "./form-documents";
import { Review } from "./form-review";
import { FormCompanyUsers } from "./form-company-users";
import { FormCompanyInfo } from "./form-company-info";

export const KYBMerchantForm: React.FC<{ onCancel: () => void; initialEmail: string }> = ({ initialEmail }) => {

  const {
    activeTab,
    setActiveTab,
    stepCompletion,
    onSubmitStep,
    handleCancel,
    createMerchantData,
    formData,
    updateFormData,
  } = useMerchantForm(initialEmail);

  const handleEditStep = (step: string) => {
    setActiveTab(step);
  };

  return (
    <FormCard className="overflow-y-auto max-h-screen" title="Know Your Business">
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="company-info" title="Company Info">
          <FormCompanyInfo
            onSubmit={(data) => onSubmitStep(1, data)}
            initialData={formData.companyInfo}
            updateFormData={(data) => updateFormData({ companyInfo: data })}
          />
        </Tab>
        <Tab key="company-owner" title="Company Owner">
          <FormCompanyUsers onSubmit={(data) => onSubmitStep(2, data)} />
        </Tab>
        <Tab key="review" title="Review">
          <Review
            data={createMerchantData}
            onSubmit={() => onSubmitStep(2, createMerchantData)}
            onEdit={handleEditStep}
          />
        </Tab>
        <Tab key="documents" title="Documents">
          <Documents
            handleCancel={handleCancel}
            stepCompletion={stepCompletion}
            merchantResponse={createMerchantData}
            onSubmitStep={(step) => onSubmitStep(step, createMerchantData)}
          />
        </Tab>
      </Tabs>
    </FormCard>
  );
};

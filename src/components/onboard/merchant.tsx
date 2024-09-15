"use client";

import React from "react";
import { Tabs, Tab } from "@nextui-org/tabs";

import { FormCard } from "@/components/generics/form-card";
import { useMerchantForm } from "@/hooks/merchant/useMerchantForm";

import { FormCompanyUsers } from "./form-company-users";
import { FormCompanyInfo } from "./form-company-info";

export const KYBMerchantForm: React.FC<{ onCancel: () => void; initialEmail: string }> = ({ initialEmail }) => {
  const {
    activeTab,
    setActiveTab,
    onSubmitStep,
    handleCancel,
    handleKYCDone,
    createMerchantData,
    formData,
    updateFormData,
  } = useMerchantForm(initialEmail);

  return (
    <FormCard className="overflow-y-auto max-h-screen" title="Know Your Business">
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="company-info" title="Company Info">
          <FormCompanyInfo
            initialData={formData.companyInfo}
            updateFormData={(data) => updateFormData({ companyInfo: data })}
            onSubmit={(data) => onSubmitStep(1, data)}
          />
        </Tab>
        <Tab key="company-owner" title="Company Owner">
          <FormCompanyUsers
            initialData={formData.companyUsers}
            updateFormData={(data) => updateFormData({ companyUsers: data })}
            onSubmit={(data) => onSubmitStep(2, data)}
          />
        </Tab>
        <Tab key="documents" title="Documents">
          <TermsAndKYB
            kybLink={createMerchantData?.data.kycLink || null}
            tosLink={createMerchantData?.data.tosLink || null}
            onCancel={handleCancel}
            onKYCDone={handleKYCDone}
          />
        </Tab>
      </Tabs>
    </FormCard>
  );
};

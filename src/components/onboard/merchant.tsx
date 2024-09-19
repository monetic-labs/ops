"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@nextui-org/tabs";

import { FormCard } from "@/components/generics/form-card";
import Notification from "@/components/generics/notification";
import { useMerchantForm } from "@/hooks/merchant/useMerchantForm";

import { FormCompanyUsers } from "./form-company-users";
import { FormCompanyInfo } from "./form-company-info";
import { TermsAndKYB } from "./form-bridge-kyb";

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

  const [notification, setNotification] = useState<string | null>(null);

  const handleStep2Success = () => {
    setNotification("Company Owner information submitted successfully!");
    setTimeout(() => setNotification(null), 3000); // Clear notification after 3 seconds
  };

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
            onSubmit={(data) => {
              onSubmitStep(2, data);
              handleStep2Success();
            }}
            />
            {notification && <Notification message={notification} />}
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

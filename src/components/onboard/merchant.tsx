"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@nextui-org/tabs";

import { FormCard } from "@/components/generics/form-card";
import Notification from "@/components/generics/notification";
import { useMerchantForm } from "@/hooks/merchant/useMerchantForm";

import { FormCompanyUsers } from "./form-company-users";
import { FormCompanyInfo } from "./form-company-info";
import { TermsAndKYB } from "./form-bridge-kyb";
import { FormCompanyDetails } from "./form-company-details";
import { FormOwnerDetails } from "./form-owner-details";

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

  const handleStep3Success = () => {
    setNotification("Company Owner information submitted successfully!");
    setTimeout(() => setNotification(null), 2000); // Clear notification after 3 seconds
  };

  return (
    <FormCard className="overflow-y-auto max-h-screen" title="Know Your Business">
      
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="company-info" title="Open Account">
          <FormCompanyInfo
            initialData={formData.companyInfo}
            updateFormData={(data) => updateFormData({ companyInfo: data })}
            onSubmit={(data) => {
              console.log("data", data);
              onSubmitStep(1, data);
            }}
          />
        </Tab>
        <Tab key="company-details" title="Configure Entity">
          <FormCompanyDetails
            initialData={formData.companyDetails}
            updateFormData={(data) => updateFormData({ companyDetails: data })}
            onSubmit={(data) => onSubmitStep(2, data)}
          />
        </Tab>
        <Tab key="owners-users" title="Owner(s) & Users">
          <FormCompanyUsers
            initialData={formData.companyUsers}
            updateFormData={(data) => updateFormData({ companyUsers: data })}
            onSubmit={(data) => {
              onSubmitStep(3, data);
              handleStep3Success();
            }}
            />
            {notification && <Notification message={notification} />}
        </Tab>
        <Tab key="owner-details" title="Owner Details">
          <FormOwnerDetails
            initialData={formData.ownerDetails}
            updateFormData={(data) => updateFormData({ ownerDetails: data })}
            onSubmit={(data) => onSubmitStep(4, data)}
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

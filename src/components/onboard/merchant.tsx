"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@nextui-org/tabs";

import { FormCard } from "@/components/generics/form-card";
import Notification from "@/components/generics/notification";
import { useMerchantForm } from "@/hooks/merchant/useMerchantForm";

import { FormCompanyOwner } from "./form-account-owner";
import { FormCompanyInfo } from "./form-company-info";
import { AccountRegistration } from "./form-bridge-kyb";
import { FormCompanyDetails } from "./form-company-details";
import { FormOwnerDetails } from "./form-owner-details";
import { FormCompanyUsers } from "./form-company-users";

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
        <Tab key="company-account" title="Company Account">
          <FormCompanyInfo
            initialData={formData.companyAccount}
            updateFormData={(data) => updateFormData({ companyAccount: data })}
            onSubmit={(data) => {
              console.log("data", data);
              onSubmitStep(1, data);
            }}
          />
        </Tab>
        <Tab key="company-details" title="Company Details">
          <FormCompanyDetails
            initialData={formData.companyDetails}
            updateFormData={(data) => updateFormData({ companyDetails: data })}
            onSubmit={(data) => onSubmitStep(2, data)}
          />
        </Tab>
        <Tab key="account-owner" title="Account Owner">
          <FormCompanyOwner
            initialData={formData.representatives[0]}
            updateFormData={(data) => updateFormData({ representatives: [data] })}
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
        <Tab key="register-account" title="Register Account">
          <AccountRegistration
            kybLink={createMerchantData?.data.kycLink || null}
            tosLink={createMerchantData?.data.tosLink || null}
            onCancel={handleCancel}
            onKYCDone={handleKYCDone}
          />
        </Tab>
        <Tab key="add-users" title="Add Users">
          <FormCompanyUsers
            initialData={formData.addUser || [{ email: "", phoneNumber: "" }]}
            updateFormData={(data) => updateFormData({ addUser: data })}
            onSubmit={(data) => onSubmitStep(6, data)}
          />
        </Tab>
      </Tabs>
    </FormCard>
  );
};

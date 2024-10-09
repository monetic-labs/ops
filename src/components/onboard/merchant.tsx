"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@nextui-org/tabs";

import { FormCard } from "@/components/generics/form-card";
import Notification from "@/components/generics/notification";
import { useMerchantForm } from "@/hooks/merchant/useMerchantForm";

import { FormCompanyInfo } from "./form-company-account";
import { AccountRegistration } from "./form-bridge-kyb";
import { FormCompanyDetails } from "./form-company-details";
import { FormOwnerDetails } from "./form-owner-details";
import { FormAccountUsers } from "./form-account-users";
import { CompanyRepresentativeSchema, UserDetailsSchema } from "@/validations/onboard";
import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

type ValidRole = "super-admin" | "admin" | "developer" | "bookkeeper" | "member";

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

  const ensureValidRole = (role: string): ValidRole => {
    const validRoles: ValidRole[] = ["super-admin", "admin", "developer", "bookkeeper", "member"];
    return validRoles.includes(role as ValidRole) ? (role as ValidRole) : "member";
  };

  const validatedAccountUsers: CompanyRepresentativeSchema = {
    representatives: formData.accountUsers.representatives.map(user => ({
      ...user,
      role: ensureValidRole(user.role)
    }))
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
        <Tab key="account-users" title="Account Users">
        <FormAccountUsers
            initialData={validatedAccountUsers}
            updateFormData={(data: CompanyRepresentativeSchema) => updateFormData({ accountUsers: data })}
            onSubmit={(data: CompanyRepresentativeSchema) => {
              onSubmitStep(3, data);
              handleStep3Success();
            }}
          />
            {notification && <Notification message={notification} />}
        </Tab>
        <Tab key="user-details" title="User Details">
          <FormOwnerDetails
            initialData={formData.userDetails}
            updateFormData={(data: UserDetailsSchema) => updateFormData({ 
              userDetails: data.map(user => ({
                ...user,
                countryOfIssue: user.countryOfIssue as ISO3166Alpha2Country
              }))
            })}
            onSubmit={(data: UserDetailsSchema) => onSubmitStep(4, data)}
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
      </Tabs>
    </FormCard>
  );
};

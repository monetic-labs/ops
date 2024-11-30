"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { PersonRole } from "@backpack-fux/pylon-sdk";

import { FormCard } from "@/components/generics/form-card";
import { useOnboardForm } from "@/hooks/onboard/useOnboardForm";
import { CompanyAccountUsersSchema, CompanyUserDetailsSchema } from "@/types/validations/onboard";

import { FormCompanyInfo } from "./form-company-account";
import { AccountRegistration } from "./form-register-account";
import { FormCompanyDetails } from "./form-company-details";
import { FormUserDetails } from "./form-user-details";
import { FormAccountUsers } from "./form-account-users";

type ValidRole = "owner" | "representative" | "beneficial-owner";

export const MerchantOnboard: React.FC<{ onCancel: () => void; initialEmail: string }> = ({ initialEmail }) => {
  const {
    tabs,
    activeTab,
    setActiveTab,
    onSubmitStep,
    handleCancel,
    handleKYCDone,
    isRainToSAccepted,
    handleRainToSAccepted,
    rainToSError,
    createMerchantData,
    formData,
    updateFormData,
    userCount,
    rainError,
    isCreatingRainMerchant,
    createRainMerchantData,
    createRainMerchantError,
  } = useOnboardForm(initialEmail);

  const [notification, setNotification] = useState<string | null>(null);

  const ensureValidRole = (role: string): ValidRole => {
    const validRoles: ValidRole[] = ["owner", "representative", "beneficial-owner"];

    return validRoles.includes(role as ValidRole) ? (role as ValidRole) : "owner";
  };

  const assignBridgeUserRole = (role: ValidRole, index: number): PersonRole => {
    if (role === "owner" || index === 0) {
      return PersonRole.SUPER_ADMIN;
    }

    return PersonRole.MEMBER;
  };

  const validatedAccountUsers: CompanyAccountUsersSchema = {
    representatives: formData.accountUsers.representatives.map((rep, index) => {
      const validatedRole = ensureValidRole(rep.role);

      return {
        firstName: rep.firstName,
        lastName: rep.lastName,
        email: rep.email,
        phoneNumber: rep.phoneNumber,
        role: validatedRole,
        bridgeUserRole: assignBridgeUserRole(validatedRole, index),
      };
    }),
  };

  const mainTabs = tabs.filter((tab) => !tab.key.startsWith("user-details-"));
  const userDetailTabs = tabs.filter((tab) => tab.key.startsWith("user-details-"));

  return (
    <FormCard className="overflow-y-auto max-h-screen" title="Know Your Business" data-testid="onboarding-form">
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        {mainTabs.map((tab) => (
          <Tab key={tab.key} title={tab.title}>
            {tab.key === "company-account" && (
              <FormCompanyInfo
                initialData={formData.companyAccount}
                updateFormData={(data) => updateFormData({ companyAccount: data })}
                onSubmit={(data) => {
                  console.log("data", data);
                  onSubmitStep(1, data);
                }}
              />
            )}
            {tab.key === "company-details" && (
              <FormCompanyDetails
                initialData={formData.companyDetails}
                updateFormData={(data) => updateFormData({ companyDetails: data })}
                onSubmit={(data) => onSubmitStep(2, data)}
              />
            )}
            {tab.key === "account-users" && (
              <FormAccountUsers
                initialData={validatedAccountUsers}
                updateFormData={(data: CompanyAccountUsersSchema) => updateFormData({ accountUsers: data })}
                onSubmit={(data: CompanyAccountUsersSchema) => {
                  onSubmitStep(3, data);
                }}
              />
            )}
            {tab.key === "user-details" && (
              <FormUserDetails
                accountUsers={formData.accountUsers.representatives}
                activeTab={activeTab}
                initialData={{ userDetails: formData.userDetails }}
                setActiveTab={setActiveTab}
                tabs={userDetailTabs}
                updateFormData={(data: CompanyUserDetailsSchema) => updateFormData({ userDetails: data.userDetails })}
                userCount={userCount}
                onSubmit={(data: CompanyUserDetailsSchema) => onSubmitStep(4, data)}
              />
            )}
            {tab.key === "register-account" && (
              <AccountRegistration
                email={formData.accountUsers.representatives[0].email}
                handleRainToSAccepted={handleRainToSAccepted}
                isRainToSAccepted={isRainToSAccepted}
                kybBridgeLink={createMerchantData?.data.kycLink || null}
                rainToSError={rainToSError}
                tosBridgeLink={createMerchantData?.data.tosLink || null}
                onCancel={handleCancel}
                onKYCDone={handleKYCDone}
                isRainToSAccepted={isRainToSAccepted}
                rainToSError={rainToSError}
                handleRainToSAccepted={handleRainToSAccepted}
                email={formData.accountUsers.representatives[0].email}
                accountUsers={formData.accountUsers.representatives.filter((user) => user.role !== "representative")}
                userDetails={formData.userDetails}
              />
            )}
          </Tab>
        ))}
      </Tabs>
      {rainError && <p className="text-ualert-500">Rain Error: {rainError}</p>}
      {isCreatingRainMerchant && <p>Creating Rain merchant...</p>}
      {createRainMerchantError && <p className="text-ualert-500">Error: {createRainMerchantError}</p>}
      {createRainMerchantData && (
        <p className="text-green-500" data-testid="rain-merchant-created">
          Rain merchant created successfully!
        </p>
      )}
    </FormCard>
  );
};

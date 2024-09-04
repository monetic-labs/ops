"use client";

import React from "react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { FormCard } from "@/components/onboard/form-card";
import { CompanyInfo } from "./form-company-info";
import { CompanyOwner } from "./form-company-owners";
import { Validate } from "./form-validate";
import { Documents } from "./form-documents";
import { useMerchantForm } from "@/hooks/merchant/useMerchantForm";

export const KYBMerchantForm: React.FC<{ onCancel: () => void; initialEmail: string }> = ({ onCancel, initialEmail }) => {
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
    otp,
    isOtpComplete,
    otpSubmitted,
    otpInputs,
    handleOtpChange,
    handleResendOTP,
    isIssueLoading,
    issueError,
    verifyError,
    tosLink,
    createMerchant,
    isCreatingMerchant,
    createMerchantError,
    createMerchantData,
    formKey,
    watch
  } = useMerchantForm(initialEmail, onCancel);

  return (
    <FormCard title="KYB Merchant Onboarding" className="overflow-y-auto max-h-screen">
      <Tabs key={formKey} selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="company-info" title="Company Info">
          <CompanyInfo
            control={control}
            errors={errors}
            handleZipCodeLookup={handleZipCodeLookup}
            addressLookup={addressLookup}
            isAddressModalOpen={isAddressModalOpen}
            setIsAddressModalOpen={setIsAddressModalOpen}
            handleCancel={handleCancel}
            onSubmitStep={onSubmitStep}
            initialEmail={initialEmail}
            watch={watch}
          />
        </Tab>
        <Tab key="company-owner" title="Company Owner">
          <CompanyOwner
            control={control}
            errors={errors}
            fields={fields}
            append={append as () => void}
            remove={remove}
            handleCancel={handleCancel}
            onSubmitStep={onSubmitStep}
            stepCompletion={stepCompletion}
            initialEmail={initialEmail}
            watch={watch}
          />
        </Tab>
        <Tab key="validate" title="Validate">
          <Validate
            otp={otp}
            isOtpComplete={isOtpComplete}
            otpSubmitted={otpSubmitted}
            otpInputs={otpInputs}
            handleOtpChange={handleOtpChange}
            handleCancel={handleCancel}
            handleResendOTP={handleResendOTP}
            onSubmitStep={onSubmitStep}
            stepCompletion={stepCompletion}
            isIssueLoading={isIssueLoading}
            issueError={issueError}
            verifyError={verifyError}
            createMerchant={createMerchant}
            isCreatingMerchant={isCreatingMerchant}
            createMerchantError={createMerchantError}
            createMerchantData={createMerchantData}
          />
        </Tab>
        <Tab key="documents" title="Documents">
          <Documents
            tosLink={tosLink}
            handleCancel={handleCancel}
            onSubmitStep={onSubmitStep}
            stepCompletion={stepCompletion}
          />
        </Tab>
      </Tabs>
    </FormCard>
  );
};
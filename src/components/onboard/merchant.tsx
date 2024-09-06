"use client";

import React from "react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { useRouter } from "next/navigation";

import { FormCard } from "@/components/onboard/form-card";
import { useMerchantForm } from "@/hooks/merchant/useMerchantForm";

import { CompanyInfo } from "./form-company-info";
import { CompanyOwner } from "./form-company-owners";
import { Validate } from "./form-validate";
import { Documents } from "./form-documents";
import { MerchantFormData } from "@/validations/merchant";
import { Control, FieldErrors } from "react-hook-form";

export const KYBMerchantForm: React.FC<{ onCancel: () => void; initialEmail: string }> = ({
  initialEmail,
}) => {
  const router = useRouter();
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
  } = useMerchantForm(initialEmail, () => router.push("/auth"));

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
        <Tab key="validate" title="Validate">
          <Validate
            createMerchant={createMerchant}
            createMerchantData={createMerchantData}
            createMerchantError={createMerchantError}
            handleCancel={handleCancel}
            handleOtpChange={handleOtpChange}
            handleResendOTP={handleResendOTP}
            isCreatingMerchant={isCreatingMerchant}
            isIssueLoading={isIssueLoading}
            isOtpComplete={isOtpComplete}
            issueError={issueError}
            otp={otp}
            otpInputs={otpInputs}
            otpSubmitted={otpSubmitted}
            stepCompletion={stepCompletion}
            verifyError={verifyError}
            onSubmitStep={onSubmitStep}
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

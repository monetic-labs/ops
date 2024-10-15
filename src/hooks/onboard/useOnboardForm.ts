import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import { useFormState } from './useFormState';
import { useTabManagement } from './useTabManagement';
import { useMerchantCreateAPIs } from './useMerchantCreateAPIs';
import { useIpAddress } from './useIpAddress';

import { mapToBridgeMerchantCreateDto } from "@/types/adapters/mapBridge";
import { mapToRainMerchantCreateDto } from "@/types/adapters/mapRain";
import { CompanyAccountSchema, CompanyAccountUsersSchema, CompanyDetailsSchema, CompanyUserDetailsSchema } from "@/types/validations/onboard";

export const useOnboardForm = (initialEmail: string) => {
  const router = useRouter();
  const { formData, updateFormData, stepCompletion, setStepCompletion } = useFormState(initialEmail);
  const { tabs, activeTab, setActiveTab, updateTabCompletion, updateTabTitle, addTab, removeTabs } = useTabManagement();
  const { createBridgeMerchant, createRainMerchant, isCreatingMerchant, createMerchantError, createMerchantData, isCreatingRainMerchant, createRainMerchantError, createRainMerchantData } = useMerchantCreateAPIs();
  const { ipAddress } = useIpAddress();

  const [userCount, setUserCount] = useState(1);
  const [tosLink, setTosLink] = useState<string | null>(null);
  const [merchantResponse, setMerchantResponse] = useState<MerchantCreateOutput | null>(null);
  const [isRainToSAccepted, setIsRainToSAccepted] = useState(false);
  const [rainError, setRainError] = useState<string | null>(null);

  const handleCancel = () => {
    router.push("/auth");
  };

  const handleKYCDone = () => {
    router.push("/auth");
  };

  const handleRainToSAccepted = useCallback(async () => {
    setIsRainToSAccepted(true);
    const result = await handleStep5();
    if (result.success) {
      console.log('Rain merchant created successfully:', result.data);
    } else {
      console.error('Failed to create Rain merchant:', result.error);
      setRainError(result.error?.message || 'Unknown error');
    }
  }, [formData, createRainMerchant, ipAddress]);

  const handleStep1 = (data: CompanyAccountSchema) => {
    updateFormData({ ...formData, companyAccount: data });
    setActiveTab("company-details");
    updateTabCompletion("company-account", true);
  };

  const handleStep2 = (data: CompanyDetailsSchema) => {
    updateFormData({ ...formData, companyDetails: data });
    setActiveTab("account-users");
    updateTabCompletion("company-details", true);
  };

  const handleStep3 = (data: CompanyAccountUsersSchema) => {
    const updatedFormData = { ...formData, accountUsers: data };
    const newUserCount = data.representatives.length;
    setUserCount(newUserCount);
    adjustUserDetailsTabs(data.representatives);
    updateFormData(updatedFormData);
    setActiveTab("user-details");
    updateTabCompletion("account-users", true);
  };

  const handleStep4 = async (data: CompanyUserDetailsSchema) => {
    const updatedFormData = { ...formData, userDetails: data.userDetails };
    const bridgeData = mapToBridgeMerchantCreateDto(
      updatedFormData.companyAccount,
      updatedFormData.companyDetails,
      updatedFormData.accountUsers 
    );
    try {
      const { success: bridgeSuccess, data: bridgeResponse, error: bridgeError } = await createBridgeMerchant(bridgeData);
      if (bridgeSuccess) {
        setMerchantResponse(bridgeResponse);
        setTosLink(bridgeResponse?.data.tosLink || "");
      } else {
        console.error("Error creating merchant:", bridgeError);
      }
    } catch (error) {
      console.error("Error creating merchant:", error);
    }
    updateFormData(updatedFormData);
    setActiveTab("register-account");
    updateTabCompletion("user-details", true);
  };

  const handleStep5 = async () => {
    const additionalData = {
      isTermsOfServiceAccepted: isRainToSAccepted,
      ipAddress: ipAddress,
      iovationBlackbox: '',
      chainId: '1',
      expectedSpend: '100000',
      //country: formData.companyAccount.company.registeredAddress.country,
    };
    const rainData = mapToRainMerchantCreateDto(
      formData.companyAccount,
      formData.companyDetails,
      formData.accountUsers,
      { userDetails: formData.userDetails },
      additionalData
    );
    try {
      const response = await createRainMerchant(rainData);
      updateTabCompletion("register-account", true);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while creating the merchant.';
      setRainError(errorMessage);
      return { success: false, error: { message: errorMessage, code: 'UNKNOWN_ERROR' } };
    }
  };

  const onSubmitStep = useCallback(
    async (step: number, data: any) => {
      console.log(`Step ${step} data:`, data);
      switch (step) {
        case 1:
          handleStep1(data);
          break;
        case 2:
          handleStep2(data);
          break;
        case 3:
          handleStep3(data);
          break;
        case 4:
          await handleStep4(data);
          break;
        case 5:
          const stepResult = await handleStep5();
          if (stepResult.success) {
            console.log('Rain merchant created successfully:', stepResult.data);
          } else {
            console.error('Failed to create Rain merchant:', stepResult.error);
            setRainError(stepResult.error?.message || 'Unknown error');
          }
          break;
        default:
          console.error("Invalid step number");
          return;
      }
    },
    [formData, updateFormData, createBridgeMerchant, createRainMerchant, isRainToSAccepted, setActiveTab, updateTabCompletion, setRainError]
  );

  const adjustUserDetailsTabs = useCallback((representatives: any[]) => {
    const userDetailsTabs = tabs.filter(tab => tab.key.startsWith('user-details-'));
    const currentUserCount = userDetailsTabs.length;
    const newUserCount = representatives.length;

    if (newUserCount > currentUserCount) {
      // Add new tabs
      for (let i = currentUserCount; i < newUserCount; i++) {
        const rep = representatives[i];
        addTab({
          key: `user-details-${i}`,
          title: `${rep.firstName} ${rep.lastName}`,
          isCompleted: false
        });
      }
    } else if (newUserCount < currentUserCount) {
      // Remove excess tabs
      const tabsToRemove = userDetailsTabs.slice(newUserCount).map(tab => tab.key);
      removeTabs(tabsToRemove);
    }

    // Update titles for existing tabs
    representatives.forEach((rep, index) => {
      updateTabTitle(`user-details-${index}`, `${rep.firstName} ${rep.lastName}`);
    });
  }, [tabs, addTab, removeTabs, updateTabTitle]);

  return {
    tabs,
    activeTab,
    setActiveTab,
    stepCompletion,
    handleCancel,
    handleKYCDone,
    isRainToSAccepted,
    handleRainToSAccepted,
    onSubmitStep,
    userCount,
    setUserCount,
    formData,
    updateFormData,
    getUserCount: () => formData.accountUsers.representatives.length,
    createBridgeMerchant,
    isCreatingMerchant,
    createMerchantError,
    createMerchantData,
    tosLink,
    rainError,
    isCreatingRainMerchant,
    createRainMerchantError,
    createRainMerchantData
  };
};
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ISO3166Alpha2Country, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import { useFormPersistence } from "@/hooks/generics/useFormPersistence";
import { useCreateBridgeMerchant } from "@/hooks/merchant/useCreateMerchant";

import { useRainCreateMerchant } from "@/hooks/merchant/useRainCreateMerchant";

import { mapToBridgeMerchantCreateDto } from "@/types/adapters/mapBridge";
import { mapToRainMerchantCreateDto } from "@/types/adapters/mapRain";
import { TabData, useDynamicTabs } from "../generics/useDynamicTabs";

export const useMerchantForm = (initialEmail: string) => {
  const router = useRouter();
  const [userCount, setUserCount] = useState(1);
  const [tosLink, setTosLink] = useState<string | null>(null);
  const [merchantResponse, setMerchantResponse] = useState<MerchantCreateOutput | null>(null);
  const [isRainToSAccepted, setIsRainToSAccepted] = useState(false);
  const [ipAddress, setIpAddress] = useState<string>('');
  
  const initialTabs: TabData[] = [
    { key: "company-account", title: "Company Account", isCompleted: false },
    { key: "company-details", title: "Company Details", isCompleted: false },
    { key: "account-users", title: "Account Users", isCompleted: false },
    { key: "user-details", title: "User Details", isCompleted: false },
    { key: "register-account", title: "Register Account", isCompleted: false },
  ];

  const {
    tabs,
    activeTab,
    setActiveTab,
    updateTabCompletion,
    updateTabTitle,
    addTab,
    removeTabs,
  } = useDynamicTabs(initialTabs);

  useEffect(() => {
    // Fetch IP address
    fetch('https://api.ipify.org?format=json')
      .then((response) => response.json())
      .then((data) => setIpAddress(data.ip))
      .catch((error) => {
        console.error('Error fetching IP address:', error);
        setIpAddress('0.0.0.0'); // Fallback IP address
      });
  }, []);

  const handleCancel = () => {
    router.push("/auth");
  };

  const handleKYCDone = () => {
    router.push("/auth");
  };

  const handleRainToSAccepted = useCallback(() => {
    setIsRainToSAccepted(true);
  }, []);

  const initialData = {
    companyAccount: {
      company: {
        name: "",
        email: initialEmail,
        registeredAddress: {
          postcode: "",
          city: "",
          state: "",
          country: "US" as ISO3166Alpha2Country,
          street1: "",
        },
        website: "",
      },
    },
    companyDetails: {
      walletAddress: "",
      companyEIN: "",
      companyType: "",
      companyDescription: "",
    },
    accountUsers: {
      representatives: [
        {
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          role: "",
        }
    ],
    },
    userDetails: [
      {
        countryOfIssue: "US" as ISO3166Alpha2Country,
        birthday: "",
        ssn: "",
        registeredAddress: {
          postcode: "",
          city: "",
          state: "",
          country: "US" as ISO3166Alpha2Country,
          street1: "",
        },
      }
    ],
  };

  const {
    data: formData,
    updateData: updateFormData,
    resetData: resetFormData,
  } = useFormPersistence("merchantFormData", initialData);

  const [stepCompletion, setStepCompletion] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
    step6: false,
  });

  const {
    createBridgeMerchant,
    isLoading: isCreatingMerchant,
    error: createMerchantError,
    data: createMerchantData,
  } = useCreateBridgeMerchant();

  const {
    createRainMerchant,
    isLoading: isCreatingRainMerchant,
    error: createRainMerchantError,
    data: createRainMerchantData,
  } = useRainCreateMerchant();

  const onSubmitStep = useCallback(
    async (step: number, data: any) => {
      console.log(`Step ${step} data:`, data);

      let updatedFormData = { ...formData };
      let stepResult;

      switch (step) {
        case 1:
          updatedFormData.companyAccount = data;
          setActiveTab("company-details");
          updateTabCompletion("company-account", true);
          break;
        case 2:
          updatedFormData.companyDetails = data;
          setActiveTab("account-users");
          updateTabCompletion("company-details", true);
          break;
        case 3:
          updatedFormData = handleStep3Data(updatedFormData, data);
          setActiveTab("user-details");
          updateTabCompletion("account-users", true);
          break;
        case 4:
          updatedFormData = await handleStep4Data(updatedFormData, data);
          setActiveTab("register-account");
          updateTabCompletion("user-details", true);
          break;
        case 5:
          stepResult = await handleStep5Data(updatedFormData);
          if (stepResult.success) {
            updateTabCompletion("register-account", true);
            console.log('Rain merchant created successfully:', stepResult.data);
            // Handle success (e.g., show success message, navigate to next page)
          } else {
            throw new Error(stepResult.error?.message || 'Unknown error');
          }
          break;
        default:
          console.error("Invalid step number");
          return;
      }

      updateFormData(updatedFormData);
    },
    [createBridgeMerchant, formData, updateFormData, createRainMerchant, isRainToSAccepted, setActiveTab, updateTabCompletion]
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

  const handleStep3Data = (updatedFormData: any, data: any) => {
    updatedFormData.accountUsers = data;
    const newUserCount = data.representatives.length;
    setUserCount(newUserCount);
    
    adjustUserDetailsTabs(data.representatives);
  
    return updatedFormData;
  };
  
  const handleStep4Data = async (updatedFormData: any, data: any) => {
    updatedFormData.userDetails = data.userDetails;
    
    const bridgeData = mapToBridgeMerchantCreateDto(
      updatedFormData.companyAccount,
      updatedFormData.companyDetails,
      updatedFormData.accountUsers
    );
    console.log("bridgeData", bridgeData);
  
    try {
      const { success: bridgeSuccess, data: bridgeResponse, error: bridgeError } = await createBridgeMerchant(bridgeData);
      if (bridgeSuccess) {
        console.log("Bridge response:", bridgeResponse);
        setMerchantResponse(bridgeResponse);
        setTosLink(bridgeResponse?.data.tosLink || "");
      } else {
        console.error("Error creating merchant:", bridgeError);
      }
    } catch (error) {
      console.error("Error creating merchant:", error);
    }
  
    return updatedFormData;
  };
  
  const handleStep5Data = async (updatedFormData: any) => {
    const additionalData = {
      isTermsOfServiceAccepted: isRainToSAccepted,
      ipAddress: ipAddress,
      iovationBlackbox: '',    // Collect this value if applicable
      chainId: '1',            // Set to appropriate chain ID
      expectedSpend: '100000', // Set expected spend amount
      country: updatedFormData.companyAccount.company.registeredAddress.country,
    };
  
    const rainData = mapToRainMerchantCreateDto(
      updatedFormData.companyAccount,
      updatedFormData.companyDetails,
      updatedFormData.accountUsers,
      { userDetails: updatedFormData.userDetails },
      additionalData
    );
    console.log("rainData", rainData);
  
    try {
      const response = await createRainMerchant(rainData);
      console.log('Merchant created:', response);
      // Handle successful creation (e.g., show success message, update UI)
      return { success: true, data: response };
    } catch (err) {
      console.error('Failed to create merchant:', err);
      
      let errorMessage = 'An unexpected error occurred while creating the merchant.';
      let errorCode = 'UNKNOWN_ERROR';

      if (err instanceof Error) {
        errorMessage = err.message;
        // You can add more specific error handling here based on error types or messages
        if (err.message.includes('network')) {
          errorCode = 'NETWORK_ERROR';
        } else if (err.message.includes('validation')) {
          errorCode = 'VALIDATION_ERROR';
        }
        // Add more specific error checks as needed
      }

      return { success: false, error: { message: errorMessage, code: errorCode } };
    }
  };

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
    isCreatingRainMerchant,
    createRainMerchantError,
    createRainMerchantData
  };
};

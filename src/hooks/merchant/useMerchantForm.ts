import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ISO3166Alpha2Country, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import { useFormPersistence } from "@/hooks/generics/useFormPersistence";
import { useCreateBridgeMerchant } from "@/hooks/merchant/useCreateMerchant";

import { useRainCreateMerchant } from "@/hooks/merchant/useRainCreateMerchant";

import { mapToBridgeMerchantCreateDto } from "@/types/adapters/mapBridge";
import { mapToRainMerchantCreateDto } from "@/types/adapters/mapRain";

export const useMerchantForm = (initialEmail: string) => {
  const router = useRouter();
  const [userCount, setUserCount] = useState(1);
  const [tosLink, setTosLink] = useState<string | null>(null);
  const [merchantResponse, setMerchantResponse] = useState<MerchantCreateOutput | null>(null);
  const [isRainToSAccepted, setIsRainToSAccepted] = useState(false);
  const [ipAddress, setIpAddress] = useState<string>('');

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

  const [activeTab, setActiveTab] = useState("company-info");

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

      if (step === 1) {
        updatedFormData.companyAccount = data;
        setActiveTab("company-details");
      } else if (step === 2) {
        updatedFormData.companyDetails = data;
        setActiveTab("account-users");
      } else if (step === 3) {
        updatedFormData.accountUsers = data;
        const newUserCount = data.representatives.length;
        setUserCount(newUserCount);

        // Adjust userDetails array to match the new user count
        while (updatedFormData.userDetails.length < newUserCount) {
          updatedFormData.userDetails.push({
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
          });
        }
        while (updatedFormData.userDetails.length > newUserCount) {
          updatedFormData.userDetails.pop();
        }

        setActiveTab("user-details");
      } else if (step === 4) {
        updatedFormData.userDetails = data.userDetails;
          // Map to Bridge data
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
            setActiveTab("register-account");
          } else {
            console.error("Error creating merchant:", bridgeError);
          }
        } catch (error) {
          console.error("Error creating merchant:", error);
        }

        console.log("Updated user details:", updatedFormData.userDetails);
        setActiveTab("register-account");
                
      } else if (step === 5) {
        
        // Collect additional data required by Rain service
        const additionalData = {
          isTermsOfServiceAccepted: isRainToSAccepted,
          ipAddress: '127.0.0.1', // Replace with actual IP address
          iovationBlackbox: '',    // Collect this value if applicable
          chainId: '1',            // Set to appropriate chain ID
          expectedSpend: '100000', // Set expected spend amount
          country: updatedFormData.companyAccount.company.registeredAddress.country,
        };

          // Map to Rain data
        const rainData = mapToRainMerchantCreateDto(
          updatedFormData.companyAccount,
          updatedFormData.companyDetails,
          updatedFormData.accountUsers,
          { userDetails: updatedFormData.userDetails },
          additionalData
        );
        console.log("rainData", rainData);

        const { createRainMerchant, isLoading, error } = useRainCreateMerchant();
        try {
          const response = await createRainMerchant(rainData);
          console.log('Merchant created:', response);
        } catch (err) {
          console.error('Failed to create merchant:', err);
        }

        setStepCompletion((prev) => ({ ...prev, step5: true }));
        updateFormData({ ...formData, accountUsers: data });
      } 

      updateFormData(updatedFormData);
      setStepCompletion((prev) => ({ ...prev, [`step${step}`]: true }));

    },
    [createBridgeMerchant, formData, updateFormData, createRainMerchant, isRainToSAccepted]
  );

  return {
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
  };
};

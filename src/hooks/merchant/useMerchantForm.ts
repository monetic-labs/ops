import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ISO3166Alpha2Country, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import { useFormPersistence } from "@/hooks/generics/useFormPersistence";
import { useCreateBridgeMerchant } from "@/hooks/merchant/useCreateMerchant";

import { merchantConfig } from "@/config/merchant";
import { useRainCreateMerchant } from "@/hooks/merchant/useRainCreateMerchant";
import { MerchantRainCreateSchema } from "@/validations/onboard";
import { rainMapAddress } from "@/utils/helpers";

export const useMerchantForm = (initialEmail: string) => {
  const router = useRouter();
  const [userCount, setUserCount] = useState(1);
  const [tosLink, setTosLink] = useState<string | null>(null);
  const [merchantResponse, setMerchantResponse] = useState<MerchantCreateOutput | null>(null);
  const [isRainToSAccepted, setIsRainToSAccepted] = useState(false);

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
        email: "",
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

        const combinedData = updatedFormData;

        const bridgeData = {
          company: {
            name: combinedData.companyAccount.company.name,
            email: combinedData.companyAccount.company.email,
            registeredAddress: combinedData.companyAccount.company.registeredAddress,
          },
          fee: merchantConfig.fee,
          representatives: [
          {
            firstName: combinedData.accountUsers.representatives[0].firstName,
            lastName: combinedData.accountUsers.representatives[0].lastName,
            email: combinedData.accountUsers.representatives[0].email,
            phoneNumber: combinedData.accountUsers.representatives[0].phoneNumber,
          },
          ],
          walletAddress: combinedData.companyDetails.walletAddress,
        };
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
        
        const combinedData = updatedFormData;

        const rainData: MerchantRainCreateSchema = {
          name: combinedData.companyAccount.company.name,
          address: combinedData.companyAccount.company.registeredAddress,
          initialUser: {
            id: "", // You might need to generate or obtain this ID
            email: combinedData.accountUsers.representatives[0].email,
            firstName: combinedData.accountUsers.representatives[0].firstName,
            lastName: combinedData.accountUsers.representatives[0].lastName,
            birthDate: combinedData.userDetails[0].birthday,
            nationalId: combinedData.userDetails[0].ssn,
            countryOfIssue: combinedData.userDetails[0].countryOfIssue,
            address: combinedData.userDetails[0].registeredAddress,
            role: merchantConfig.role,
            iovation: merchantConfig.iovation,
            ipAddress: merchantConfig.ipAddress,
            isTermsOfServiceAccepted: isRainToSAccepted,
          },
          entity: {
            name: combinedData.companyAccount.company.name,
            website: combinedData.companyAccount.company.website,
            type: combinedData.companyDetails.companyType,
            description: combinedData.companyDetails.companyDescription,
            taxId: combinedData.companyDetails.companyEIN,
          },
          representatives: [{
            type: "representative",
            id: "", // You might need to generate or obtain this ID
            email: combinedData.accountUsers.representatives[0].email,
            firstName: combinedData.accountUsers.representatives[0].firstName,
            lastName: combinedData.accountUsers.representatives[0].lastName,
            birthDate: combinedData.userDetails[0].birthday,
            nationalId: combinedData.userDetails[0].ssn,
            countryOfIssue: combinedData.userDetails[0].countryOfIssue,
            address: combinedData.userDetails[0].registeredAddress,
          }],
          ultimateBeneficialOwners: [{
            type: "ultimateBeneficialOwner",
            id: "", // You might need to generate or obtain this ID
            email: combinedData.accountUsers.representatives[0].email,
            firstName: combinedData.accountUsers.representatives[0].firstName,
            lastName: combinedData.accountUsers.representatives[0].lastName,
            birthDate: combinedData.userDetails[0].birthday,
            nationalId: combinedData.userDetails[0].ssn,
            countryOfIssue: combinedData.userDetails[0].countryOfIssue,
            address: combinedData.userDetails[0].registeredAddress,
          }],
          chainId: merchantConfig.chainId,
          contractAddress: merchantConfig.contractAddress,
        };
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
    [createBridgeMerchant, formData, updateFormData]
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

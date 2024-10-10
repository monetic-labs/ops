import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ISO3166Alpha2Country, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import { useFormPersistence } from "@/hooks/generics/useFormPersistence";
import { useCreateBridgeMerchant } from "@/hooks/merchant/useCreateMerchant";

import { merchantConfig } from "@/config/merchant";

export const useMerchantForm = (initialEmail: string) => {
  const router = useRouter();
  const [userCount, setUserCount] = useState(1);
  const [tosLink, setTosLink] = useState<string | null>(null);
  const [merchantResponse, setMerchantResponse] = useState<MerchantCreateOutput | null>(null);

  const handleCancel = () => {
    router.push("/auth");
  };

  const handleKYCDone = () => {
    router.push("/auth");
  };

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
        setUserCount(data.representatives.length);
        setActiveTab("user-details");
      } else if (step === 4) {
        updatedFormData.userDetails = data;

        updatedFormData.accountUsers.representatives = updatedFormData.accountUsers.representatives.map((rep: any, index: number) => ({
          ...rep,
          ...data[index],
        }));
                
        const combinedData = updatedFormData;

        console.log("combinedData", combinedData);

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

        const rainData = {
          initialUser: {
            firstName: combinedData.accountUsers.representatives[0].firstName,
            lastName: combinedData.accountUsers.representatives[0].lastName,
            email: combinedData.accountUsers.representatives[0].email,
            birthday: combinedData.userDetails[0].birthday,
            ssn: combinedData.userDetails[0].ssn,
            countryOfIssue: combinedData.userDetails[0].countryOfIssue,
            registeredAddress: combinedData.userDetails[0].registeredAddress,
            
            role: merchantConfig.role,
            chainId: merchantConfig.chainId,
            contractAddress: merchantConfig.contractAddress,
            iovation: merchantConfig.iovation,
            ipAddress: merchantConfig.ipAddress,
          },
          entity: {
            name: combinedData.companyAccount.company.name,
            website: combinedData.companyAccount.company.website,
            type: combinedData.companyDetails.companyType,
            description: combinedData.companyDetails.companyDescription,
            taxId: combinedData.companyDetails.companyEIN,
            
            chainId: merchantConfig.chainId,
            contractAddress: merchantConfig.contractAddress,
          },
          representatives: {
            type: "representative",
            firstName: combinedData.accountUsers.representatives[0].firstName,
            lastName: combinedData.accountUsers.representatives[0].lastName,
            email: combinedData.accountUsers.representatives[0].email,
            address: combinedData.userDetails[0].registeredAddress,
            
            
            // these need to come from an array of objects from the addUser tab and the invite user endpoint
            birthday: combinedData.userDetails[0].birthday,
            ssn: combinedData.userDetails[0].ssn,
            countryOfIssue: combinedData.userDetails[0].countryOfIssue,
          },
          ultimateBeneficialOwners: {
            type: "ultimateBeneficialOwner", 
            firstName: combinedData.accountUsers.representatives[0].firstName,
            lastName: combinedData.accountUsers.representatives[0].lastName,
            email: combinedData.accountUsers.representatives[0].email,
            address: combinedData.userDetails[0].registeredAddress,
            
            // these need to come from an array of objects from the addUser tab and the invite user endpoint
            birthday: combinedData.userDetails[0].birthday,
            ssn: combinedData.userDetails[0].ssn,
            countryOfIssue: combinedData.userDetails[0].countryOfIssue,
          },
        };

        console.log("rainData", rainData);


        try {
          const { success: bridgeSuccess, data: bridgeResponse, error: bridgeError } = await createBridgeMerchant(bridgeData);
          //const { success: rainSuccess, data: rainResponse, error: rainError } = await createRainMerchant(rainData);

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
      } else if (step === 5) {
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

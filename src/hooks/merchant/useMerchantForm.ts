import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ISO3166Alpha2Country, MerchantCreateInput, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import { useFormPersistence } from "@/hooks/generics/useFormPersistence";
import { useCreateBridgeMerchant } from "@/hooks/merchant/useCreateMerchant";

import { merchantConfig } from "@/config/merchant";
import { AddUserSchema, OwnerDetailsSchema } from "@/validations/onboard";

export const useMerchantForm = (initialEmail: string) => {
  const router = useRouter();

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
    representatives: [
      {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      registeredAddress: {
        postcode: "",
        city: "",
        state: "",
        country: "US" as ISO3166Alpha2Country,
        street1: "",
      },
    }],
    ownerDetails: {
      walletAddress: "",
      birthday: "",
      ssn: "",
      countryOfIssue: "US" as ISO3166Alpha2Country,
    },
    addUser: [
      {
        email: "",
        phoneNumber: "",

      },
    ] as AddUserSchema,
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

      if (step === 1) {
        updateFormData({ companyAccount: data });
        setStepCompletion((prev) => ({ ...prev, step1: true }));
        setActiveTab("company-details");
      } else if (step === 2) {
        updateFormData({ companyDetails: data });
        setStepCompletion((prev) => ({ ...prev, step2: true }));
        setActiveTab("account-owner");
      } else if (step === 3) {
        updateFormData({ representatives: data });
        setStepCompletion((prev) => ({ ...prev, step3: true }));
        setActiveTab("owner-details");
      } else if (step === 4) {
        updateFormData({ ownerDetails: data });
        setStepCompletion((prev) => ({ ...prev, step4: true }));
                
        const combinedData = {
          ...formData,
          //ownerDetails: data,
        }

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
            firstName: combinedData.representatives[0].firstName,
            lastName: combinedData.representatives[0].lastName,
            email: combinedData.representatives[0].email,
            phoneNumber: combinedData.representatives[0].phoneNumber,
            walletAddress: combinedData.companyDetails.walletAddress,
          },
          ],
          walletAddress: combinedData.companyDetails.walletAddress,
        };
        console.log("bridgeData", bridgeData);

        const rainData = {
          initialUser: {
            firstName: combinedData.representatives[0].firstName,
            lastName: combinedData.representatives[0].lastName,
            email: combinedData.representatives[0].email,
            birthday: combinedData.ownerDetails.birthday,
            ssn: combinedData.ownerDetails.ssn,
            countryOfIssue: combinedData.ownerDetails.countryOfIssue,
            registeredAddress: combinedData.representatives[0].registeredAddress,
            walletAddress: combinedData.ownerDetails.walletAddress,
            //isToSAgreed: false,
            
            role: merchantConfig.role,
            chainId: merchantConfig.chainId,
            contractAddress: merchantConfig.contractAddress,
            iovation: merchantConfig.iovation,
            ipAddress: merchantConfig.ipAddress,
            // isToSAgreed => get from register account tab
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
            firstName: combinedData.representatives[0].firstName,
            lastName: combinedData.representatives[0].lastName,
            email: combinedData.representatives[0].email,
            address: combinedData.representatives[0].registeredAddress,
            
            // these need to come from an array of objects from the addUser tab and the invite user endpoint
            birthday: combinedData.ownerDetails.birthday,
            ssn: combinedData.ownerDetails.ssn,
            countryOfIssue: combinedData.ownerDetails.countryOfIssue,
          },
          ultimateBeneficialOwners: {
            type: "ultimateBeneficialOwner", 
            firstName: combinedData.representatives[0].firstName,
            lastName: combinedData.representatives[0].lastName,
            email: combinedData.representatives[0].email,
            address: combinedData.representatives[0].registeredAddress,
            
            // these need to come from an array of objects from the addUser tab and the invite user endpoint
            birthday: combinedData.ownerDetails.birthday,
            ssn: combinedData.ownerDetails.ssn,
            countryOfIssue: combinedData.ownerDetails.countryOfIssue,
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
        setActiveTab("register-account");
      } else if (step === 6) {
        updateFormData({ addUser: data });
        setStepCompletion((prev) => ({ ...prev, step6: true }));

      }
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
    formData,
    updateFormData,
    createBridgeMerchant,
    isCreatingMerchant,
    createMerchantError,
    createMerchantData,
    tosLink,
  };
};

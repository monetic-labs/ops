import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ISO3166Alpha2Country, MerchantCreateInput, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import { useFormPersistence } from "@/hooks/generics/useFormPersistence";
import { useCreateBridgeMerchant } from "@/hooks/merchant/useCreateMerchant";

import { merchantConfig } from "@/config/merchant";

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
    companyInfo: {
      company: {
        name: "",
        email: "",
        registeredAddress: {
          street1: "",
          city: "",
          postcode: "",
          state: "",
          country: "US" as ISO3166Alpha2Country,
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
    companyUsers: {
      representatives: [
        {
          name: "",
          surname: "",
          email: "",
          phoneNumber: "",
          bday: "",
          ssn: "",
        },
      ],
    },
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
        updateFormData({ companyInfo: data });
        setStepCompletion((prev) => ({ ...prev, step1: true }));
        setActiveTab("company-details");
      } else if (step === 2) {
        updateFormData({ companyDetails: data });
        setStepCompletion((prev) => ({ ...prev, step2: true }));
        setActiveTab("company-owner");
      } else if (step === 3) {
        updateFormData({ companyUsers: data });
        setStepCompletion((prev) => ({ ...prev, step3: true }));

        const combinedData = {
          ...formData,
          companyUsers: data,
        }

        const bridgeData = {
          company: {
            name: combinedData.companyInfo.company.name,
            email: combinedData.companyInfo.company.email,
            registeredAddress: combinedData.companyInfo.company.registeredAddress,
          },
          fee: merchantConfig.fee,
          representatives: combinedData.companyUsers.representatives.map((rep: any) => ({
            name: rep.name,
            surname: rep.surname,
            email: rep.email,
            phoneNumber: rep.phoneNumber,
          })),
          walletAddress: combinedData.companyDetails.walletAddress,
          compliance: combinedData.companyUsers,
        };

        const rainData = {
          company: combinedData.companyInfo.company,
          representatives: combinedData.companyUsers.representatives,
          compliance: combinedData.companyUsers,
        };

        try {
          const { success: bridgeSuccess, data: bridgeResponse, error: bridgeError } = await createBridgeMerchant(bridgeData);
          //const { success: rainSuccess, data: rainResponse, error: rainError } = await createRainMerchant(rainData);

          if (bridgeSuccess) {
            console.log("Bridge response:", bridgeResponse);
            setMerchantResponse(bridgeResponse);
            setTosLink(bridgeResponse?.data.tosLink || "");
            setActiveTab("documents");
          } else {
            console.error("Error creating merchant:", bridgeError);
          }
        } catch (error) {
          console.error("Error creating merchant:", error);
        }
      } else if (step === 3) {
        setStepCompletion((prev) => ({ ...prev, step3: true }));
        setActiveTab("documents");
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

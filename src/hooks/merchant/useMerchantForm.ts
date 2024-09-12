import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { ISO3166Alpha2Country, MerchantCreateInput, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import { useFormPersistence } from "@/hooks/generic/useFormPersistence";
import { useCreateMerchant } from "@/hooks/merchant/useCreateMerchant";
import { useSetupOTP } from "@/hooks/merchant/useSetupOTP";
import { merchantConfig } from "@/config/merchant";

export const useMerchantForm = (initialEmail: string) => {
  const router = useRouter();
  const otpHook = useSetupOTP(initialEmail);
  const [tosLink, setTosLink] = useState<string | null>(null);
  const [merchantResponse, setMerchantResponse] = useState<MerchantCreateOutput | null>(null);

  const handleCancel = () => {
    router.push("/auth");
  };

  const [activeTab, setActiveTab] = useState("company-info");
  
  const { data: formData, updateData: updateFormData, resetData: resetFormData } = useFormPersistence('merchantFormData', {
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
      },
      walletAddress: "",
    },
    companyUsers: {
      representatives: [],
    },
  });

  const [stepCompletion, setStepCompletion] = useState({
    step1: false,
    step2: false,
    step3: false,
  });

  const {
    createMerchant,
    isLoading: isCreatingMerchant,
    error: createMerchantError,
    data: createMerchantData,
  } = useCreateMerchant();

  const onSubmitStep = useCallback(
    async (step: number, data: any) => {
      console.log(`Step ${step} data:`, data);

      if (step === 1) {
        updateFormData({ companyInfo: data });
        setStepCompletion((prev) => ({ ...prev, step1: true }));
        setActiveTab("company-owner");
      } else if (step === 2) {
        updateFormData({ companyUsers: data });
        setStepCompletion((prev) => ({ ...prev, step2: true }));

        const step1Data = formData.companyInfo;

        const combinedData: MerchantCreateInput = {
          fee: merchantConfig.fee,
          company: step1Data?.company,
          representatives: data.representatives.map((rep: any) => ({
            firstName: rep.name,
            lastName: rep.surname,
            email: rep.email,
            phoneNumber: rep.phoneNumber,
            walletAddress: rep.walletAddress,
          })),
          walletAddress: step1Data.walletAddress,
        };

        try {
          const { success, data: merchantResponse, error } = await createMerchant(combinedData);

          if (success && merchantResponse) {
            console.log("useMerchantForm response:", merchantResponse);
            setMerchantResponse(merchantResponse);
            setTosLink(merchantResponse.data.tosLink);
            setActiveTab("documents");
          } else {
            console.error("Error creating merchant:", error);
          }
        } catch (error) {
          console.error("Error creating merchant:", error);
        }
      } else if (step === 3) {
        setStepCompletion((prev) => ({ ...prev, step3: true }));
        setActiveTab("documents");
      }
    },
    [createMerchant]
  );

  return {
    activeTab,
    setActiveTab,
    stepCompletion,
    handleCancel,
    onSubmitStep,
    formData,
    updateFormData,
    createMerchant,
    isCreatingMerchant,
    createMerchantError,
    createMerchantData,
    tosLink,
    ...otpHook,
  };
};
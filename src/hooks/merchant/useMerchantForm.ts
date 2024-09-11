import { useState, useCallback } from "react";
import { MerchantCreateInput, ISO3166Alpha2Country, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";
import { useCreateMerchant } from "@/hooks/merchant/useCreateMerchant";
import { merchantConfig } from "@/config/merchant";
import { useSetupOTP } from "./useSetupOTP";
import { useRouter } from "next/navigation";

export const useMerchantForm = (initialEmail: string) => {
  const [activeTab, setActiveTab] = useState("company-info");
  const [stepCompletion, setStepCompletion] = useState({
    step1: false,
    step2: false,
    step3: false,
  });
  const [tosLink, setTosLink] = useState<string | null>(null);
  const [merchantResponse, setMerchantResponse] = useState<MerchantCreateOutput | null>(null);

  const router = useRouter();

  const {
    createMerchant,
    isLoading: isCreatingMerchant,
    error: createMerchantError,
    data: createMerchantData,
  } = useCreateMerchant();

  const otpHook = useSetupOTP(initialEmail);

  const onSubmitStep = useCallback(
    async (step: number, data: any) => {
      console.log(`Step ${step} data:`, data);

      if (step === 1) {
        setStepCompletion((prev) => ({ ...prev, step1: true }));
        setActiveTab("company-owner");
      } else if (step === 2) {
        setStepCompletion((prev) => ({ ...prev, step2: true }));

        const step1Data = JSON.parse(localStorage.getItem('step1Data') || '{}');

        const combinedData: MerchantCreateInput = {
          fee: merchantConfig.fee,
          company: step1Data.company,
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

  const handleCancel = () => {
    router.push("/auth");
  };

  return {
    activeTab,
    setActiveTab,
    stepCompletion,
    handleCancel,
    onSubmitStep,
    createMerchant,
    isCreatingMerchant,
    createMerchantError,
    createMerchantData,
    tosLink,
    ...otpHook,
  };
};
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

        const combinedData: MerchantCreateInput = {
          fee: merchantConfig.fee,
          walletAddress: data.walletAddress,
          company: {
            name: data.company.name,
            email: data.company.email,
            registeredAddress: {
              street1: data.company.registeredAddress.street1,
              street2: data.company.registeredAddress.street2 || "",
              city: data.company.registeredAddress.city,
              postcode: data.company.registeredAddress.postcode || "",
              state: data.company.registeredAddress.state || "",
              country: (data.company.registeredAddress.country || "US") as ISO3166Alpha2Country,
            },
          },
          representatives: [
            {
              firstName: data.representatives[0].name,
              lastName: data.representatives[0].surname,
              email: data.representatives[0].email,
              phoneNumber: data.representatives[0].phoneNumber,
            },
          ],
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
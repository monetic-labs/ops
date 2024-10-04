import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ISO3166Alpha2Country, MerchantCreateInput, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import { useFormPersistence } from "@/hooks/generics/useFormPersistence";
import { useCreateBridgeMerchant } from "@/hooks/merchant/useCreateMerchant";

import { merchantConfig } from "@/config/merchant";
import { OwnerDetailsSchema } from "@/validations/onboard";

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
    companyUsers: {
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
        },
      ],
    },
    ownerDetails: {
      role: "" as OwnerDetailsSchema["role"],
      walletAddress: "",
      birthday: "",
      ssn: "",
    },
    addUser: {
      email: "",
      phoneNumber: "",
    }
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
        updateFormData({ companyUsers: data });
        setStepCompletion((prev) => ({ ...prev, step3: true }));
        setActiveTab("owner-details");
      } else if (step === 4) {
        updateFormData({ ownerDetails: data });
        setStepCompletion((prev) => ({ ...prev, step4: true }));
                
        const combinedData = {
          ...formData,
          ownerDetails: data,
        }

        console.log("combinedData", combinedData);

        const bridgeData = {
          company: {
            name: combinedData.companyAccount.company.name,
            email: combinedData.companyAccount.company.email,
            registeredAddress: combinedData.companyAccount.company.registeredAddress,
          },
          fee: merchantConfig.fee,
          representatives: (combinedData.companyUsers.representatives || []).map((rep: any) => ({
            firstName: rep.firstName,
            lastName: rep.lastName,
            email: rep.email,
            phoneNumber: rep.phoneNumber,
            walletAddress: rep.walletAddress,
          })),
          walletAddress: combinedData.companyDetails.walletAddress,
        };

        console.log("bridgeData", bridgeData);

        const rainData = {
          company: combinedData.companyAccount.company,
          representatives: combinedData.companyUsers.representatives,
          compliance: combinedData.companyUsers,
        };

        console.log("rainData", rainData);

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
      } else if (step === 5) {
        setStepCompletion((prev) => ({ ...prev, step5: true }));
        setActiveTab("documents");
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

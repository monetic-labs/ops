import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { MerchantCreateInput, ISO3166Alpha2Country, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";
import { useRouter } from "next/navigation";

import { MerchantFormData } from "@/data/merchant";
import { useCreateMerchant } from "@/hooks/merchant/useCreateMerchant";
import { merchantConfig } from "@/config/merchant";
import { lookupZipCode } from "@/utils/helpers";

import { useSetupOTP } from "./useSetupOTP";

export const useMerchantForm = (initialEmail: string, onCancel: () => void) => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("company-info");
  const [stepCompletion, setStepCompletion] = useState({
    step1: false,
    step2: false,
    step3: false,
  });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressLookup, setAddressLookup] = useState<{
    city: string;
    state: string;
    postcode: string;
    country: string;
  } | null>(null);
  const [tosLink, setTosLink] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    watch,
    setValue,
  } = useForm<MerchantFormData>({
    defaultValues: {
      representatives: [{ name: "", surname: "", email: initialEmail, phoneNumber: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "representatives",
  });

  const {
    createMerchant,
    isLoading: isCreatingMerchant,
    error: createMerchantError,
    data: createMerchantData,
  } = useCreateMerchant();

  const otpHook = useSetupOTP(initialEmail);

  useEffect(() => {
    setValue("company.email", initialEmail);
    setValue("representatives.0.email", initialEmail);
    setFormKey((prevKey) => prevKey + 1);
  }, [setValue, initialEmail, getValues]);

  const handleZipCodeLookup = useCallback(async (zipCode: string) => {
    if (zipCode.length === 5) {
      try {
        const result = await lookupZipCode(zipCode);
        const formattedResult = {
          ...result,
          state: result.state,
          country: result.country,
        };

        setAddressLookup(formattedResult);
        setIsAddressModalOpen(true);
      } catch (error) {
        console.error("Error looking up zip code:", error);
      }
    }
  }, []);

  const onSubmitStep = useCallback(
    async (step: number) => {
      const isValid = await trigger();

      if (!isValid) return;

      const data = getValues();

      console.log(`Step ${step} data:`, data);

      if (step === 1) {
        setStepCompletion((prev) => ({ ...prev, step1: true }));
        setActiveTab("company-owner");
      } else if (step === 2) {
        setStepCompletion((prev) => ({ ...prev, step2: true }));

        const combinedData: MerchantCreateInput = {
          fee: merchantConfig.fee,
          walletAddress: data.company.settlementAddress as `0x${string}`,
          company: {
            name: data.company.name,
            email: data.company.email,
            registeredAddress: {
              street1: data.company.mailingAddress.street1,
              street2: data.company.mailingAddress.street2 || "",
              city: data.company.mailingAddress.city,
              postcode: data.company.mailingAddress.postcode || "",
              state: data.company.mailingAddress.state || "",
              country: (data.company.mailingAddress.country || "US") as ISO3166Alpha2Country,
            },
          },
          representatives: data.representatives.map((rep) => ({
            name: rep.name,
            surname: rep.surname,
            email: rep.email,
            phoneNumber: rep.phoneNumber,
          })),
        };

        try {
          const response = await createMerchant(combinedData);

          if (response) {
            const merchantResponse = response as MerchantCreateOutput;

            setTosLink(merchantResponse.data.compliance.tosLink);
          }

          const email = getValues("representatives.0.email");

          if (email) {
            const otpInitiated = await otpHook.initiateOTP(email);

            if (otpInitiated) {
              setActiveTab("validate");
            } else {
              console.error("Failed to initiate OTP");
            }
          }
        } catch (error) {
          console.error("Error creating merchant:", error);
        }
      } else if (step === 3) {
        setStepCompletion((prev) => ({ ...prev, step3: true }));
        setActiveTab("documents");
      }
    },
    [createMerchant, getValues, otpHook.initiateOTP, trigger, watch]
  );

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return {
    activeTab,
    setActiveTab,
    stepCompletion,
    control,
    errors,
    fields,
    append,
    remove,
    handleZipCodeLookup,
    addressLookup,
    isAddressModalOpen,
    setIsAddressModalOpen,
    handleCancel,
    onSubmitStep,
    createMerchant,
    isCreatingMerchant,
    createMerchantError,
    createMerchantData,
    formKey,
    tosLink,
    watch,
    ...otpHook,
  };
};

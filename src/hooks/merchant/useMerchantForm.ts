import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { MerchantCreateInput, ISO3166Alpha2Country, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import { merchantCreateSchema, MerchantFormData } from "@/validations/merchant";
import { useCreateMerchant } from "@/hooks/merchant/useCreateMerchant";
import { merchantConfig } from "@/config/merchant";
import { lookupZipCode } from "@/utils/helpers";

import { useSetupOTP } from "./useSetupOTP";
import { zodResolver } from "@hookform/resolvers/zod";

export const useMerchantForm = (initialEmail: string, onCancel: () => void) => {

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
  const [merchantResponse, setMerchantResponse] = useState<MerchantCreateOutput | null>(null);

  const {
    control,
    formState: { errors, isValid },
    getValues,
    trigger,
    watch,
    setValue,
  } = useForm<MerchantFormData>({
    resolver: zodResolver(merchantCreateSchema),
    mode: "onChange",
    defaultValues: {
      company: { name: "", email: initialEmail, registeredAddress: { street1: "", city: "", country: "US" as ISO3166Alpha2Country } },
      representatives: [{ name : "", surname: "", email: initialEmail, phoneNumber: "" }],
      walletAddress: "",
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
    console.log("initialEmail", initialEmail);
    
    setValue("representatives.0.email", initialEmail);
    console.log("representatives.0.email", getValues("representatives.0.email"));
    
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

      if (!isValid) {
        console.error("Form validation failed:", errors);
        return;
      }

      const data = getValues();
      console.log(`Step ${step} data:`, data);

      if (step === 1) {
        setStepCompletion((prev) => ({ ...prev, step1: true }));
        setActiveTab("company-owner");
        console.log("Step 1 data:", data);
      } else if (step === 2) {
        setStepCompletion((prev) => ({ ...prev, step2: true }));

        const combinedData: MerchantCreateInput = {
          fee: merchantConfig.fee,
          walletAddress: data.walletAddress as `0x${string}`,
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
          representatives: [{
            name: data.representatives[0].name,
            surname: data.representatives[0].surname,
            email: data.representatives[0].email,
            phoneNumber: data.representatives[0].phoneNumber,
          }],
        };

        console.log("Step 2 data:", combinedData);

        try {
          const { success, data: merchantResponse, error } = await createMerchant(combinedData);

          if (success && merchantResponse) {
            console.log("useMerchantForm response:", merchantResponse);
            setMerchantResponse(merchantResponse);
            setTosLink(merchantResponse.data.compliance.tosLink);
            setActiveTab("documents");
          } else {
            console.error("Error creating merchant:", error);
            // Handle the error, maybe show an error message to the user
          }
        } catch (error) {
          console.error("Error creating merchant:", error);
          // Handle the error, maybe show an error message to the user
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

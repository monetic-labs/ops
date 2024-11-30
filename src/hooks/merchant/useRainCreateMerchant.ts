import { useState } from "react";
import { MerchantRainCompanyCreateOutput, MerchantRainCompanyCreateInput } from "@backpack-fux/pylon-sdk";
import pylon from "@/libs/pylon-sdk";

export const useRainCreateMerchant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantRainCompanyCreateOutput | null>(null);

  const createRainMerchant = async (
    data: MerchantRainCompanyCreateInput
  ): Promise<MerchantRainCompanyCreateOutput | null> => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const createRainMerchant: MerchantRainCompanyCreateInput = {
        initialUser: {
          ...data.initialUser,
        },
        name: data.name,
        entity: data.entity,
        address: data.address,
        representatives: data.representatives,
        ultimateBeneficialOwners: data.ultimateBeneficialOwners,
      };

      console.log("useRainCreateMerchant:", JSON.stringify(createRainMerchant, null, 2));
      const response = await pylon.applyCardCompany(createRainMerchant);

      console.log("useRainCreateMerchant response:", response);

      setIsLoading(false);
      setData(response);

      return response;
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";

      setError(errorMessage);
      console.error("useCreateMerchant error:", errorMessage);

      return null;
    }
  };

  return {
    createRainMerchant,
    isLoading,
    error,
    data,
  };
};

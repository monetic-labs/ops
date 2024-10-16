import { useState } from "react";
import pylon from "@/libs/pylon-sdk";
import { MerchantRainCompanyCreateOutput, MerchantRainCompanyCreateInput } from "@backpack-fux/pylon-sdk";
import { RainMerchantCreateDto } from "@/types/dtos/rainDTO";

export const useRainCreateMerchant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantRainCompanyCreateOutput | null>(null);

  const createRainMerchant = async (data: RainMerchantCreateDto): Promise<MerchantRainCompanyCreateOutput | null> => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      console.log("useRainCreateMerchant:", data);

      const createRainMerchant: MerchantRainCompanyCreateInput = {
        initialUser: data.initialUser,
        name: data.name,
        entity: data.entity,
        address: data.address,
        representatives: data.representatives,
        ultimateBeneficialOwners: data.ultimateBeneficialOwners,
      };
      const response = await pylon.applyCardCompany(createRainMerchant);

      console.log("useRainCreateMerchant response:", response);

      setIsLoading(false);
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

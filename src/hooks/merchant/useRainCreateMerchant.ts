import { useState } from 'react';
import pylon from "@/libs/pylon-sdk";
import { MerchantRainCompanyCreateOutput, MerchantRainCompanyCreateInput } from '@backpack-fux/pylon-sdk';
import { RainMerchantData } from '@/types/merchant';

export const useRainCreateMerchant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantRainCompanyCreateOutput | null>(null);

  const createRainMerchant = async (data: RainMerchantData): Promise<MerchantRainCompanyCreateOutput | null> => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      console.log("useCreateMerchant:", data);
      
      const sdkInput: MerchantRainCompanyCreateInput = {
        name: data.name,
        initialUser: data.initialUser,
        entity: data.entity,
        representatives: data.representatives,
        ultimateBeneficialOwners: data.ultimateBeneficialOwners,
        chainId: data.chainId,
        contractAddress: data.contractAddress,
      };
      const response = await pylon.applyCardCompany(sdkInput);

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
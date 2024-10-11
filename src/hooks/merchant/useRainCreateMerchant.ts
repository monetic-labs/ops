import { useState } from 'react';
import { MerchantRainCreateSchema } from '@/validations/onboard';
import pylon from "@/libs/pylon-sdk";
import { MerchantRainCompanyCreateOutput } from '@backpack-fux/pylon-sdk';

export const useRainCreateMerchant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRainMerchant = async (data: MerchantRainCreateSchema): Promise<MerchantRainCompanyCreateOutput | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("useCreateMerchant:", data);
      const response = await pylon.applyCardCompany(data);

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
    error
  };
};
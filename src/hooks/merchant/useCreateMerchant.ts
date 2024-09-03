import { useState } from 'react';
import { MerchantCreateInput, MerchantCreateOutput } from '@backpack-fux/pylon-sdk';
import  pylon  from '@/libs/pylon-sdk';

export function useCreateMerchant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantCreateOutput | null>(null);

  const createMerchant = async (input: MerchantCreateInput): Promise<MerchantCreateOutput | null> => {
    setIsLoading(true);
    setError(null);
    try {

      console.log("useCreateMerchant:", input);
      const response = await pylon.createMerchant(input);
      console.log("useCreateMerchant response:", response);
      
      setData(response);
      setIsLoading(false);
      return response;
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  return { createMerchant, isLoading, error, data };
}
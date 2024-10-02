import { useState } from "react";
import { MerchantCreateInput, MerchantCreateOutput } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

export function useCreateBridgeMerchant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantCreateOutput | null>(null);

  const createBridgeMerchant = async (
    input: MerchantCreateInput
  ): Promise<{ success: boolean; data: MerchantCreateOutput | null; error: string | null }> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("useCreateMerchant:", input);
      const response = await pylon.createMerchant(input);

      console.log("useCreateMerchant response:", response);

      if (response && response.statusCode === 200) {
        setData(response);
        setIsLoading(false);

        return { success: true, data: response, error: null };
      } else {
        setError("Merchant creation failed");
        setIsLoading(false);

        return { success: false, data: null, error: "Merchant creation failed" };
      }
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";

      setError(errorMessage);

      return { success: false, data: null, error: errorMessage };
    }
  };

  return { createBridgeMerchant: createBridgeMerchant, isLoading, error, data };
}

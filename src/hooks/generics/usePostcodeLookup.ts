import { useState, useCallback } from "react";

import { lookupPostcode } from "@/utils/helpers";

interface PostcodeLookupResult {
  city: string;
  state: string;
}

export const usePostcodeLookup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PostcodeLookupResult | null>(null);

  const lookup = useCallback(async (zipCode: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await lookupPostcode(zipCode);

      if (data) {
        const formattedData = {
          ...data,
          state: data.state,
        };

        setResult(formattedData);

        return formattedData;
      } else {
        throw new Error("No data returned from postcode lookup");
      }
    } catch (err) {
      console.error("Postcode lookup error:", err);
      setError("Unable to lookup postcode. Please enter address manually.");

      // Return a null result to indicate lookup failure
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    lookup,
    isLoading,
    error,
    result,
    setResult,
  };
};


import { useState, useCallback } from 'react';
import { lookupPostcode } from '@/utils/helpers';

interface PostcodeLookupResult {
  city: string;
  state: string;
}

export const usePostcodeLookup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PostcodeLookupResult | null>(null);

  const lookup = useCallback(async (zipCode: string) => {
    console.log('In usePostcodeLookup', zipCode);

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await lookupPostcode(zipCode);
      const formattedData = {
        ...data,
        state: data.state,
      };
      setResult(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during zip code lookup');
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
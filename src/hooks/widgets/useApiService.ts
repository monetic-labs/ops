import { useState, useCallback } from "react";
import pylon from "@/libs/pylon-sdk";
import { ApiKeyGetOutput } from "@backpack-fux/pylon-sdk";

export function useApiService() {
  const [apiKeys, setApiKeys] = useState<ApiKeyGetOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApiKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const keys = await pylon.getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      setError("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateApiKey = useCallback(async (name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newKey = await pylon.createApiKey({ apiKeyName: name });
      setApiKeys((prevKeys) => [...prevKeys, newKey]);
      return newKey;
    } catch (err) {
      setError("Failed to generate API key");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteApiKey = useCallback(async (apiKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await pylon.deleteApiKey(apiKey);
      setApiKeys((prevKeys) => prevKeys.filter((key) => key.key !== apiKey));
    } catch (err) {
      setError("Failed to delete API key");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    apiKeys,
    isLoading,
    error,
    loadApiKeys,
    generateApiKey,
    deleteApiKey,
  };
}

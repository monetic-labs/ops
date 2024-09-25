import { useState, useCallback } from 'react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

const mockApiService = {
  generateApiKey: async (name: string): Promise<ApiKey> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          name,
          key: Math.random().toString(36).substr(2, 32),
          createdAt: new Date().toISOString(),
          lastUsed: null,
        });
      }, 1000);
    });
  },
  getApiKeys: async (): Promise<ApiKey[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Test Key',
            key: 'test-key-123',
            createdAt: '2023-01-01T00:00:00Z',
            lastUsed: '2023-01-02T00:00:00Z',
          },
        ]);
      }, 500);
    });
  },
  deleteApiKey: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  },
};

export function useApiService() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApiKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const keys = await mockApiService.getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      setError('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateApiKey = useCallback(async (name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newKey = await mockApiService.generateApiKey(name);
      setApiKeys(prevKeys => [...prevKeys, newKey]);
      return newKey;
    } catch (err) {
      setError('Failed to generate API key');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteApiKey = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await mockApiService.deleteApiKey(id);
      setApiKeys(prevKeys => prevKeys.filter(key => key.id !== id));
    } catch (err) {
      setError('Failed to delete API key');
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
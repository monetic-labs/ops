import { useState } from "react";

import pylon from "@/libs/pylon-sdk";

interface SensitiveInfo {
  cvv?: string;
  pan?: string;
}

interface CardSensitiveInfoCache {
  [cardId: string]: SensitiveInfo;
}

// In-memory cache that persists between hook instances
const sensitiveInfoCache: CardSensitiveInfoCache = {};

export function useCardSensitiveInfo(cardId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = async () => {
    if (isVisible) {
      setIsVisible(false);

      return;
    }

    // If we have cached data, use it
    if (sensitiveInfoCache[cardId]) {
      setIsVisible(true);

      return;
    }

    // Otherwise fetch from API
    try {
      setIsLoading(true);
      setError(null);
      const details = await pylon.decryptVirtualCard(cardId);

      if (details) {
        sensitiveInfoCache[cardId] = {
          cvv: details.decryptedCvc,
          pan: details.decryptedPan,
        };
        setIsVisible(true);
      }
    } catch (err) {
      console.error("Failed to decrypt card details:", err);
      setError(err instanceof Error ? err.message : "Failed to load card details");
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = () => {
    delete sensitiveInfoCache[cardId];
    setIsVisible(false);
  };

  return {
    sensitiveInfo: isVisible ? sensitiveInfoCache[cardId] : undefined,
    isLoading,
    error,
    isVisible,
    toggleVisibility,
    clearCache,
  };
}

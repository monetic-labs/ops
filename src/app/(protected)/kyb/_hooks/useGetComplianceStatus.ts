import { useEffect, useState, useCallback } from "react";
import { GetComplianceStatusResponse, MerchantRainCompanyStatusOutput } from "@monetic-labs/sdk";

import pylon from "@/libs/monetic-sdk";

export function useGetComplianceStatus() {
  const [complianceStatus, setComplianceStatus] = useState<
    (GetComplianceStatusResponse & MerchantRainCompanyStatusOutput) | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown | null>(null);

  const checkCompliance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [bridgeComplianceStatus, rainComplianceStatus] = await Promise.all([
        pylon.getComplianceStatus(),
        pylon.getCardCompanyStatus(),
      ]);
      const combinedStatus = { ...bridgeComplianceStatus, ...rainComplianceStatus };
      setComplianceStatus(combinedStatus);
      return combinedStatus;
    } catch (err) {
      console.error("Failed to fetch compliance status:", err);
      setError(err);
      setComplianceStatus(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkCompliance();
  }, [checkCompliance]);

  return { complianceStatus, isLoading, error, refetch: checkCompliance };
}

import { useEffect, useState } from "react";
import { GetComplianceStatusResponse, MerchantRainCompanyStatusOutput } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

export function useGetComplianceStatus() {
  const [complianceStatus, setComplianceStatus] = useState<
    (GetComplianceStatusResponse & MerchantRainCompanyStatusOutput) | null
  >(null);

  useEffect(() => {
    async function checkCompliance() {
      const [bridgeComplianceStatus, rainComplianceStatus] = await Promise.all([
        pylon.getComplianceStatus(),
        pylon.getCardCompanyStatus(),
      ]);
      const complianceStatus = { ...bridgeComplianceStatus, ...rainComplianceStatus };

      console.log("complianceStatus", complianceStatus);
      setComplianceStatus(complianceStatus);
    }
    checkCompliance();
  }, []);

  return { complianceStatus };
}

import { useEffect, useState } from "react";
import { GetComplianceStatusResponse, MerchantRainCompanyStatusOutput } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

export function useGetComplianceStatus() {
  const [complianceStatus, setComplianceStatus] = useState<
    (GetComplianceStatusResponse & MerchantRainCompanyStatusOutput) | null
  >(null);

  useEffect(() => {
    async function checkCompliance() {
      const [complianceStatus, rainCardCompany] = await Promise.all([
        pylon.getComplianceStatus(),
        pylon.getCardCompanyStatus(),
      ]);

      console.log("bridgeTosStatus", complianceStatus.tosStatus);
      console.log("bridgeKybStatus", complianceStatus.kycStatus);
      console.log("rainKybStatus", rainCardCompany.applicationStatus);

      setComplianceStatus({ ...complianceStatus, ...rainCardCompany });
    }
    checkCompliance();
  }, []);

  return { complianceStatus };
}

import { useEffect, useState } from "react";
import { GetComplianceStatusResponse } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

export function useGetComplianceStatus() {
  const [complianceStatus, setComplianceStatus] = useState<GetComplianceStatusResponse | null>(null);

  useEffect(() => {
    async function checkCompliance() {
      const complianceStatus = await pylon.getComplianceStatus();
       console.log("complianceStatus", complianceStatus);

      setComplianceStatus({
        data: {
          kycLink: complianceStatus.kycLink,
          tosLink: complianceStatus.tosLink,
          kycStatus: complianceStatus.kycStatus,
          tosStatus: complianceStatus.tosStatus
        }
      });
    }
    checkCompliance();
  }, []);

  return { complianceStatus };
}

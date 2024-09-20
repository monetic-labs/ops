import { useEffect, useState } from "react";
import { GetComplianceStatusResponse } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

export function useGetComplianceStatus() {
  const [complianceStatus, setComplianceStatus] = useState<GetComplianceStatusResponse | null>(null);

  useEffect(() => {
    async function checkCompliance() {
      const complianceStatus = await pylon.getComplianceStatus();

      setComplianceStatus(complianceStatus);
    }
    checkCompliance();
  }, []);

  return { complianceStatus };
}

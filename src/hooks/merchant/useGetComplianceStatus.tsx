import { useEffect, useState } from "react";
import { GetComplianceStatusResponse } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

export function useGetComplianceStatus() {
  const [complianceStatus, setComplianceStatus] = useState<GetComplianceStatusResponse | null>(null);

  useEffect(() => {
    async function checkCompliance() {
      const isCompliant = await pylon.getComplianceStatus();

      setComplianceStatus(isCompliant);
    }
    checkCompliance();
  }, []);

  return { complianceStatus };
}

import { useState } from "react";
import { MerchantDisbursementUpdateInput, MerchantDisbursementUpdateOutput } from "@backpack-fux/pylon-sdk";
import pylon from "@/libs/pylon-sdk";

export const useExistingDisbursement = () => {
  const [disbursement, setDisbursement] = useState<MerchantDisbursementUpdateOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const createExistingDisbursement = async (disbursementId: string, disbursement: MerchantDisbursementUpdateInput) => {
    setIsLoading(true);
    try {
      const response = await pylon.initiateExistingDisbursement(disbursementId, disbursement);
      setDisbursement(response);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { disbursement, isLoading, error, createExistingDisbursement };
};

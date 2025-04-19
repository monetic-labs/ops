import { useState } from "react";
import { DisbursementMethod, MerchantDisbursementUpdateOutput } from "@monetic-labs/sdk";

import pylon from "@/libs/pylon-sdk";

export const useExistingDisbursement = () => {
  const [disbursement, setDisbursement] = useState<MerchantDisbursementUpdateOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const createExistingDisbursement = async (
    disbursementId: string,
    {
      amount,
      disbursementMethod,
      wireMessage,
      achReference,
    }: { amount: string; disbursementMethod: DisbursementMethod; wireMessage?: string; achReference?: string }
  ) => {
    setIsLoading(true);
    try {
      const response = await pylon.initiateExistingDisbursement(disbursementId, {
        amount: parseFloat(amount),
        destination: {
          payment_rail: disbursementMethod,
          wire_message: wireMessage,
          ach_reference: achReference,
        },
      });

      setDisbursement(response);

      return response;
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { disbursement, isLoading, error, createExistingDisbursement };
};

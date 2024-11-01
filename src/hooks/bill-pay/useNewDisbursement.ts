import { useState } from "react";
import { MerchantDisbursementCreateInput, MerchantDisbursementCreateOutput } from "@backpack-fux/pylon-sdk";

export const useNewDisbursement = () => {
  const [disbursement, setDisbursement] = useState<MerchantDisbursementCreateOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const createDisbursement = async (disbursement: MerchantDisbursementCreateInput) => {
    setIsLoading(true);
    try {
      // TODO
      //   setTransfer(response);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };
};

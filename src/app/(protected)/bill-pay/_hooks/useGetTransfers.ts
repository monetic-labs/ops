import { useState, useEffect } from "react";
import { MerchantDisbursementEventGetOutput, Pagination } from "@monetic-labs/sdk";

import pylon from "@/libs/monetic-sdk";

export const useGetTransfers = ({ before, after }: { before?: string; after?: string }) => {
  const [transfers, setTransfers] = useState<MerchantDisbursementEventGetOutput[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const pageSize = 10;

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const response = await pylon.getDisbursementEvents({
        limit: pageSize,
        before,
        after,
      });

      setTransfers(response.events);
      setPagination(response.meta);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [before, after]); // Re-fetch when pagination params change

  return { transfers, pagination, isLoading, error, fetchTransfers };
};

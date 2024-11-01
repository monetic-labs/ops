import { useState } from "react";
import { MerchantDisbursementEventGetOutput, Pagination } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

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

  return { transfers, pagination, isLoading, error, fetchTransfers };
};

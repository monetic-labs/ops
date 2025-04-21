import { useState, useCallback } from "react";
import { MerchantDisbursementCreateOutput, Pagination } from "@monetic-labs/sdk";

import pylon from "@/libs/monetic-sdk";

export const useGetContacts = () => {
  const [contacts, setContacts] = useState<MerchantDisbursementCreateOutput[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const pageSize = 10;

  const fetchContacts = useCallback(
    async ({ before, after, search }: { before?: string; after?: string; search?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await pylon.getDisbursementContacts({
          limit: pageSize,
          before,
          after,
          search,
        });

        setContacts(response.contacts);
        setPagination(response.meta);
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  return { contacts, pagination, isLoading, error, fetchContacts };
};

import { useState } from "react";
import { MerchantDisbursementCreateOutput, Pagination } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

export const useGetContacts = () => {
  const [contacts, setContacts] = useState<MerchantDisbursementCreateOutput[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const pageSize = 10;

  const fetchContacts = async ({ before, after, search }: { before?: string; after?: string; search?: string }) => {
    setIsLoading(true);
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
  };

  return { contacts, pagination, isLoading, error, fetchContacts };
};

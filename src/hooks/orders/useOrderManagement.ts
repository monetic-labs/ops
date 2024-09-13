import { useState, useEffect, useCallback } from "react";
import { TransactionListOutput, TransactionListItem, useAuthStatus } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";
import { useRouter } from "next/navigation";

export const useOrderManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);

  const { isAuthenticated, checkAuthStatus } = useAuthStatus();
  const router = useRouter();

  const sortTransactionsByDate = (transactions: TransactionListItem[]) => {
    return [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const handleTransactionUpdate = useCallback((data: TransactionListOutput) => {
    switch (data.type) {
      case "INITIAL_LIST":
        setTransactions(data.data as TransactionListItem[]);
        setIsLoading(false);
        break;
      case "TRANSACTION_UPDATED":
        setTransactions((prevTransactions) => {
          const updatedTransaction = data.data as TransactionListItem;
          const existingIndex = prevTransactions.findIndex((t) => t.id === updatedTransaction.id);
          let newTransactions;


          if (existingIndex !== -1) {
            // Update existing transaction
            newTransactions = [...prevTransactions];
            newTransactions[existingIndex] = { ...newTransactions[existingIndex], ...updatedTransaction };
          } else {
            // Add new transaction
            newTransactions = [updatedTransaction, ...prevTransactions];
          }


          return sortTransactionsByDate(newTransactions);
        });
        break;
      default:
        setError("Unknown transaction update type");
        console.warn("Unknown transaction update type:", data.type);
    }
  }, []);

  useEffect(() => {
    let closeConnection: (() => void) | undefined;

    const setupConnection = async () => {
      if (isAuthenticated) {
        setIsLoading(true);
        try {
          closeConnection = await pylon.getTransactionList(handleTransactionUpdate);
        } catch (error) {
          console.error("Failed to set up transaction list:", error);
          setError("Failed to connect to transaction list");
        } finally {
          setIsLoading(false);
        }
      } else {
        setTransactions([]);
        setError(null);
        setIsLoading(false);
        if (closeConnection) {
          closeConnection();
          closeConnection = undefined;
        }
      }
    };

    if (!isAuthenticated) {
      router.refresh();
    }

    setupConnection();

    return () => {
      if (closeConnection) {
        closeConnection();
      }
    };
  }, [isAuthenticated, handleTransactionUpdate]);

  return {
    isLoading,
    error,
    transactions,
  };
};

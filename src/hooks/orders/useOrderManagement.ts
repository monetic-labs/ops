import { useState, useEffect, useCallback } from "react";
import { TransactionListOutput, TransactionListItem, useAuthStatus } from "@backpack-fux/pylon-sdk";
import pylon from "@/libs/pylon-sdk";

export const useOrderManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);

  const { isAuthenticated, checkAuthStatus } = useAuthStatus(pylon);

  const handleTransactionUpdate = useCallback((data: TransactionListOutput) => {
    switch (data.type) {
      case "INITIAL_LIST":
        setTransactions(data.data as TransactionListItem[]);
        setIsLoading(false);
        break;
      case "TRANSACTION_UPDATED":
        setTransactions((prevTransactions) => {
          const updatedTransaction = data.data as TransactionListItem | Partial<TransactionListItem>;
          return prevTransactions.map((transaction) =>
            transaction.id === updatedTransaction.id ? { ...transaction, ...updatedTransaction } : transaction
          );
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

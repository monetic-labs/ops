import { useState, useEffect, useCallback } from "react";
import { TransactionListOutput, TransactionListItem } from "@backpack-fux/pylon-sdk";
import { useRouter } from "next/navigation";

import pylon from "@/libs/pylon-sdk";

export const useOrderManagement = () => {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: string | null;
    transactions: TransactionListItem[];
  }>({
    isLoading: true,
    error: null,
    transactions: [],
  });

  const router = useRouter();

  const sortTransactionsByDate = useCallback((transactions: TransactionListItem[]) => {
    return [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, []);

  const updateTransactions = useCallback(
    (updater: (prev: TransactionListItem[]) => TransactionListItem[]) => {
      setState((prevState) => ({
        ...prevState,
        transactions: sortTransactionsByDate(updater(prevState.transactions)),
      }));
    },
    [sortTransactionsByDate]
  );

  const handleInitialList = useCallback(
    (data: TransactionListItem[]) => {
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        transactions: sortTransactionsByDate(data),
      }));
    },
    [sortTransactionsByDate]
  );

  const handleTransactionUpdated = useCallback(
    (updatedTransaction: TransactionListItem) => {
      console.log("Updated transaction:", updatedTransaction);
      updateTransactions((prevTransactions) => {
        const existingIndex = prevTransactions.findIndex((t) => t.id === updatedTransaction.id);

        if (existingIndex !== -1) {
          const newTransactions = [...prevTransactions];

          newTransactions[existingIndex] = updatedTransaction;

          return newTransactions;
        }

        return [updatedTransaction, ...prevTransactions];
      });
    },
    [updateTransactions]
  );

  const handleTransactionUpdate = useCallback(
    (data: TransactionListOutput) => {
      switch (data.type) {
        case "KEEP_ALIVE":
          // These are just to keep the connection alive, no need to update state
          break;
        case "INITIAL_LIST":
          handleInitialList(data.data.transactions);
          break;
        case "TRANSACTION_UPDATED":
          handleTransactionUpdated(data.data);
          break;
        default:
          setState((prevState) => ({
            ...prevState,
            error: "Unknown transaction update type",
          }));
          console.warn("Unknown transaction update type:", data);
      }
    },
    [handleInitialList, handleTransactionUpdated]
  );

  useEffect(() => {
    let closeConnection: (() => void) | undefined;

    const setupConnection = async () => {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));
      try {
        closeConnection = await pylon.getTransactionList(handleTransactionUpdate);
      } catch (error) {
        console.error("Failed to set up transaction list:", error);
        setState((prevState) => ({
          ...prevState,
          error: "Failed to connect to transaction list",
        }));
      } finally {
        setState((prevState) => ({ ...prevState, isLoading: false }));
      }
    };

    setupConnection();

    return () => {
      if (closeConnection) {
        closeConnection();
      }
    };
  }, [handleTransactionUpdate, router]);

  return state;
};

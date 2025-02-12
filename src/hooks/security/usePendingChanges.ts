import { useState } from "react";

import { PendingChanges } from "./types";

export const usePendingChanges = () => {
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    toAdd: [],
    toDelete: [],
    onChainTransactions: [],
  });

  const addPendingChange = (change: Partial<PendingChanges>) => {
    setPendingChanges((prev) => ({
      ...prev,
      ...change,
    }));
  };

  const clearPendingChanges = () => {
    setPendingChanges({
      toAdd: [],
      toDelete: [],
      onChainTransactions: [],
    });
  };

  const hasPendingChanges =
    pendingChanges.toAdd.length > 0 ||
    pendingChanges.toDelete.length > 0 ||
    pendingChanges.onChainTransactions.length > 0;

  return {
    pendingChanges,
    addPendingChange,
    clearPendingChanges,
    hasPendingChanges,
  };
};

import React, { useCallback, useEffect, useState } from "react";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";

import TransactionReceiptModal from "@/components/card-issuance/modal-transaction-receipt";
import InfiniteTable from "@/components/generics/table-infinite";
import { cardTransactionColumns, CardTransactions } from "@/data";
import { getOpepenAvatar } from "@/utils/helpers";
import { cardTransactionData } from "@/data";

const statusColorMap: Record<string, "success" | "warning" | "danger"> = {
  Completed: "success",
  Pending: "warning",
  Cancelled: "danger",
};

export default function TransactionListTable() {
  const [selectedTransaction, setSelectedTransaction] = useState<(typeof cardTransactionData)[0] | null>(null);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const newAvatars: Record<string, string> = {};

    cardTransactionData.forEach((transaction) => {
      newAvatars[transaction.id] = getOpepenAvatar(transaction.id, 32);
    });
    setAvatars(newAvatars);
  }, []);

  const renderCell = useCallback(
    (transaction: CardTransactions, columnKey: keyof CardTransactions) => {
      const cellValue = transaction[columnKey];

      switch (columnKey) {
        case "merchantId":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: avatars[transaction.id],
              }}
              description={transaction.id}
              name={cellValue}
            >
              {transaction.id}
            </User>
          );
        case "amount":
          return (
            <Chip className="capitalize" color={statusColorMap[transaction.amount]} size="sm" variant="flat">
              {cellValue}
            </Chip>
          );
        default:
          return cellValue;
      }
    },
    [avatars]
  );

  const loadMore = async (cursor: string | undefined) => {
    const pageSize = 10;
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + pageSize;
    const newItems = cardTransactionData.slice(startIndex, endIndex);
    const newCursor = endIndex < cardTransactionData.length ? endIndex.toString() : undefined;

    return { items: newItems, cursor: newCursor };
  };

  const handleRowSelect = useCallback((transaction: CardTransactions) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  }, []);

  return (
    <>
      <InfiniteTable
        columns={cardTransactionColumns}
        initialData={cardTransactionData}
        loadMore={loadMore}
        renderCell={renderCell}
        onRowSelect={handleRowSelect}
      />
      {selectedTransaction && (
        <>
          <TransactionReceiptModal
            isOpen={isDetailsModalOpen}
            transaction={selectedTransaction}
            onClose={() => setIsDetailsModalOpen(false)}
          />
        </>
      )}
    </>
  );
}

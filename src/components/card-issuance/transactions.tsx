// REFAC THIS LATER
import React, { useCallback, useState } from "react";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { MerchantCardTransactionGetOutput } from "@backpack-fux/pylon-sdk";

import TransactionDetailsModal from "@/components/card-issuance/card-txns";
import InfiniteTable from "@/components/generics/table-infinite";
import { getOpepenAvatar } from "@/utils/helpers";
import pylon from "@/libs/pylon-sdk";

const statusColorMap: Record<string, "success" | "warning" | "danger" | "primary"> = {
  COMPLETED: "success",
  PPENDING: "primary",
  DECLINED: "danger",
  REVERSED: "warning",
};

type HybridTransaction = MerchantCardTransactionGetOutput["transactions"][number] & {
  avatar?: string;
  spender: string;
};

const transactions: HybridTransaction[] = [];

export default function TransactionListTable() {
  const [selectedTransaction, setSelectedTransaction] = useState<HybridTransaction | null>(null);
  const renderCell = useCallback((transaction: HybridTransaction, columnKey: keyof HybridTransaction) => {
    switch (columnKey) {
      case "merchantName":
        return (
          <User
            avatarProps={{
              radius: "lg",
              src: transaction.avatar,
            }}
            description={transaction.id}
            name={transaction.merchantName}
          >
            {transaction.id}
          </User>
        );
      case "status":
        return (
          <Chip className="capitalize" color={statusColorMap[transaction.status]} size="sm" variant="flat">
            {transaction.status}
          </Chip>
        );
      case "amount":
        return (
          <Chip className="capitalize" color={"default"} size="sm" variant="flat">
            {(transaction.amount / 100).toPrecision(4)} {transaction.currency}
          </Chip>
        );
      case "createdAt": {
        return (
          <p>
            {new Date(transaction.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour12: true,
              hour: "numeric",
              minute: "numeric",
              second: "2-digit",
            })}
          </p>
        );
      }
      case "spender": {
        return <p>{transaction.spender}</p>;
      }
      default:
        return <></>;
    }
  }, []);

  const loadMore = async (cursor: string | undefined) => {
    try {
      const { transactions, meta } = await (cursor && cursor?.length > 1
        ? pylon.getCardTransactions({ after: cursor })
        : pylon.getCardTransactions({}));

      return {
        items: transactions.map((t) => ({
          ...t,
          avatar: getOpepenAvatar(t.merchantName, 20),
          spender: t.merchantCard.cardOwner.firstName + " " + t.merchantCard.cardOwner.lastName,
        })),
        cursor: meta.endCursor,
      };
    } catch (error) {
      console.log(error);

      return { items: [], cursor: "" };
    }
  };

  const handleRowSelect = useCallback((transaction: HybridTransaction) => {
    setSelectedTransaction(transaction);
  }, []);

  return (
    <>
      <InfiniteTable
        columns={[
          { name: "MERCHANT NAME", uid: "merchantName" },
          { name: "AMOUNT", uid: "amount" },
          { name: "STATUS", uid: "status" },
          { name: "SPENDER", uid: "spender" },
          { name: "DATE", uid: "createdAt" },
        ]}
        initialData={transactions}
        loadMore={loadMore}
        renderCell={renderCell}
        onRowSelect={handleRowSelect}
      />
      {selectedTransaction && (
        <>
          <TransactionDetailsModal
            isOpen={Boolean(selectedTransaction)}
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        </>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { Spinner } from "@nextui-org/spinner";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MerchantCardTransactionGetOutput } from "@backpack-fux/pylon-sdk";

import InfiniteTable from "@/components/generics/table-infinite";
import { formatNumber, formattedDate } from "@/utils/helpers";
import pylon from "@/libs/pylon-sdk";

import TransactionDetailsModal from "./card-txns";

type Transaction = MerchantCardTransactionGetOutput["transactions"][number] & { id: string };

interface TransactionPage {
  items: Transaction[];
  cursor: string | undefined;
}

export default function Transactions() {
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<TransactionPage>({
      queryKey: ["card-transactions"],
      initialPageParam: undefined as string | undefined,
      queryFn: async ({ pageParam }) => {
        const response = await pylon.getCardTransactions({
          after: pageParam as string | undefined,
          limit: 10,
        });

        return {
          items: response.transactions.map((txn) => ({ ...txn, id: txn.id })),
          cursor: response.meta.endCursor,
        };
      },
      getNextPageParam: (lastPage: TransactionPage) => lastPage.cursor,
    });

  const transactions = data?.pages.flatMap((page) => page.items) ?? [];

  if (isError) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <p className="text-white/60">Failed to load transactions</p>
      </div>
    );
  }

  if (isLoading && transactions.length === 0) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <Spinner color="white" />
      </div>
    );
  }

  return (
    <>
      <InfiniteTable
        columns={[
          {
            name: "MERCHANT NAME",
            uid: "merchantName",
          },
          {
            name: "AMOUNT",
            uid: "amount",
          },
          {
            name: "STATUS",
            uid: "status",
          },
          {
            name: "SPENDER",
            uid: "merchantCard",
          },
          {
            name: "DATE",
            uid: "createdAt",
          },
        ]}
        emptyContent="No transactions found"
        initialData={transactions}
        loadMore={async (cursor) => {
          await fetchNextPage();
          const lastPage = data?.pages[data.pages.length - 1];

          return {
            items: lastPage?.items ?? [],
            cursor: lastPage?.cursor,
          };
        }}
        renderCell={(txn: Transaction, columnKey) => {
          switch (columnKey) {
            case "merchantName":
              return txn.merchantName || "Unknown Merchant";
            case "amount":
              return `$${formatNumber(txn.amount / 100)} ${txn.currency}`;
            case "status":
              return (
                <span
                  className={
                    txn.status === "COMPLETED"
                      ? "text-success"
                      : txn.status === "PENDING"
                        ? "text-warning"
                        : "text-danger"
                  }
                >
                  {txn.status}
                </span>
              );
            case "merchantCard":
              return `${txn.merchantCard.cardOwner.firstName} ${txn.merchantCard.cardOwner.lastName}`;
            case "createdAt":
              return formattedDate(txn.createdAt);
            default:
              return null;
          }
        }}
        onRowSelect={setSelectedTxn}
      />

      <TransactionDetailsModal
        isOpen={!!selectedTxn}
        transaction={selectedTxn as any} // TODO: Fix type mismatch between components
        onClose={() => setSelectedTxn(null)}
      />
    </>
  );
}

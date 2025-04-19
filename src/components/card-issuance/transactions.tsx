"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MerchantCardTransactionGetOutput } from "@monetic-labs/sdk";

import { DataTable, EmptyContent } from "@/components/generics/data-table";
import { formatAmountUSD, formattedDate } from "@/utils/helpers";
import pylon from "@/libs/pylon-sdk";

import TransactionDetailsModal from "./card-txns";

type Transaction = MerchantCardTransactionGetOutput["transactions"][number] & { id: string };

interface TransactionPage {
  items: Transaction[];
  cursor: string | undefined;
}

const transactionColumns = [
  {
    name: "MERCHANT NAME",
    uid: "merchantName" as const,
    render: (txn: Transaction) => (
      <span className="text-sm truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
        {txn.merchantName || "Unknown Merchant"}
      </span>
    ),
  },
  {
    name: "AMOUNT",
    uid: "amount" as const,
    render: (txn: Transaction) => (
      <span className="text-sm truncate">
        {formatAmountUSD(txn.amount / 100)} {txn.currency}
      </span>
    ),
  },
  {
    name: "STATUS",
    uid: "status" as const,
    render: (txn: Transaction) => (
      <span
        className={`text-sm truncate ${
          txn.status === "COMPLETED" ? "text-success" : txn.status === "PENDING" ? "text-warning" : "text-danger"
        }`}
      >
        {txn.status}
      </span>
    ),
  },
  {
    name: "SPENDER",
    uid: "merchantCard" as const,
    render: (txn: Transaction) => (
      <span className="text-sm truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
        {`${txn.merchantCard.cardOwner.firstName} ${txn.merchantCard.cardOwner.lastName}`}
      </span>
    ),
  },
  {
    name: "DATE",
    uid: "createdAt" as const,
    render: (txn: Transaction) => <span className="text-sm truncate">{formattedDate(txn.createdAt)}</span>,
  },
];

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

  return (
    <>
      <DataTable
        aria-label="Card transactions table"
        columns={transactionColumns}
        emptyContent={<EmptyContent message="No card transactions found" />}
        errorMessage="Failed to load transactions"
        isError={isError}
        isLoading={isLoading}
        items={transactions}
        onRowAction={setSelectedTxn}
      />

      <TransactionDetailsModal
        isOpen={!!selectedTxn}
        transaction={selectedTxn as any}
        onClose={() => setSelectedTxn(null)}
      />
    </>
  );
}

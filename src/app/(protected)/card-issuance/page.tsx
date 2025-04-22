"use client";

import React, { useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  MerchantCardGetOutput,
  CardStatus,
  CardLimitFrequency,
  CardType,
  MerchantCardTransactionGetOutput,
} from "@monetic-labs/sdk";
import { CreditCard, Activity, PlusIcon, CheckCircle } from "lucide-react"; // Add icons and CheckCircle icon
import { Button } from "@heroui/button";

import { DataTable, EmptyContent, Column } from "@/components/generics/data-table"; // Import Column type
import { StatCard } from "@/components/generics/stat-card"; // Import StatCard
import { formatAmountUSD, formattedDate } from "@/utils/helpers";
import pylon from "@/libs/monetic-sdk";

// Import Modals
import CardDetailsModal from "./_components/card-details";
import CreateCardModal from "./_components/card-create";
import TransactionDetailsModal from "./_components/card-txns";

// --- Types (Combined from card-list and transactions) ---
type HybridCard = MerchantCardGetOutput["cards"][number] & {
  id: string;
  avatar?: string;
  type: CardType;
  limit: number;
  limitFrequency: CardLimitFrequency;
  holder: string;
};

interface CardPage {
  items: HybridCard[];
  cursor: string | undefined;
}

type Transaction = MerchantCardTransactionGetOutput["transactions"][number] & { id: string };

interface TransactionPage {
  items: Transaction[];
  cursor: string | undefined;
}

// --- Column Definitions (Copied and adapted) ---

// Card Columns
const getStatusColor = (status: CardStatus | null | undefined) => {
  if (!status) return "text-default";
  switch (status) {
    case CardStatus.ACTIVE:
      return "text-success";
    case CardStatus.NOT_ACTIVATED:
      return "text-warning";
    case CardStatus.LOCKED:
    case CardStatus.CANCELLED:
      return "text-danger";
    default:
      return "text-default";
  }
};

const cardColumns: Column<HybridCard>[] = [
  {
    name: "CARD NUMBER",
    uid: "lastFour" as const,
    render: (card) => <span className="font-mono text-sm truncate">**** **** **** {card.lastFour}</span>,
  },
  {
    name: "STATUS",
    uid: "status" as const,
    render: (card) => <span className={`text-sm truncate ${getStatusColor(card.status)}`}>{card.status}</span>,
  },
  {
    name: "CARDHOLDER",
    uid: "cardOwner" as const,
    render: (card) => <span className="text-sm truncate">{card.holder}</span>,
  },
  {
    name: "CREATED",
    uid: "createdAt" as const,
    render: (card) => <span className="text-sm truncate">{formattedDate(card.createdAt)}</span>,
  },
];

// Transaction Columns
const transactionColumns: Column<Transaction>[] = [
  {
    name: "MERCHANT NAME",
    uid: "merchantName" as const,
    render: (txn) => <span className="text-sm truncate">{txn.merchantName || "Unknown Merchant"}</span>,
  },
  {
    name: "AMOUNT",
    uid: "amount" as const,
    render: (txn) => (
      <span className="text-sm truncate">
        {formatAmountUSD(txn.amount / 100)} {txn.currency}
      </span>
    ),
  },
  {
    name: "STATUS",
    uid: "status" as const,
    render: (txn) => (
      <span
        className={`text-sm truncate ${txn.status === "COMPLETED" ? "text-success" : txn.status === "PENDING" ? "text-warning" : "text-danger"}`}
      >
        {txn.status}
      </span>
    ),
  },
  {
    name: "SPENDER",
    uid: "merchantCard" as const,
    render: (txn) => (
      <span className="text-sm truncate">{`${txn.merchantCard.cardOwner.firstName} ${txn.merchantCard.cardOwner.lastName}`}</span>
    ),
  },
  {
    name: "DATE",
    uid: "createdAt" as const,
    render: (txn) => <span className="text-sm truncate">{formattedDate(txn.createdAt)}</span>,
  },
];

// --- Component ---
export default function CardIssuancePage() {
  // State for Modals
  const [selectedCard, setSelectedCard] = useState<HybridCard | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Query for Cards
  const {
    data: cardData,
    isLoading: isLoadingCards,
    isError: isErrorCards,
  } = useInfiniteQuery<CardPage>({
    queryKey: ["merchant-cards-issuance"], // Unique key
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      // Fetching logic copied from card-list
      const response = await pylon.getCards({ after: pageParam as string | undefined, limit: 10 });
      if (!response || !response.cards || !Array.isArray(response.cards)) {
        throw new Error("Invalid response from Pylon SDK");
      }
      const items = response.cards
        .map((card) => {
          if (!card || typeof card !== "object") return null;
          try {
            return {
              /* Mapping logic */ ...card,
              id: card.id || "",
              type: card.cardShippingDetails ? CardType.PHYSICAL : CardType.VIRTUAL,
              holder: card.cardOwner ? `${card.cardOwner.firstName} ${card.cardOwner.lastName}` : "Unknown",
              limit: typeof card.limit === "number" ? card.limit : 0,
              limitFrequency: card.limitFrequency || CardLimitFrequency.MONTH,
              status: card.status || CardStatus.NOT_ACTIVATED,
              lastFour: card.lastFour || "",
              createdAt: card.createdAt || new Date().toISOString(),
            };
          } catch (err) {
            console.warn("Error processing card:", err);
            return null;
          }
        })
        .filter((card): card is HybridCard => card !== null);
      return { items, cursor: response.meta?.endCursor };
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
    retry: 1, // Reduced retry for page load
  });

  // Query for Transactions
  const {
    data: transactionData,
    isLoading: isLoadingTxns,
    isError: isErrorTxns,
  } = useInfiniteQuery<TransactionPage>({
    queryKey: ["card-transactions-issuance"], // Unique key
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      // Fetching logic copied from transactions
      const response = await pylon.getCardTransactions({ after: pageParam as string | undefined, limit: 10 });
      return { items: response.transactions.map((txn) => ({ ...txn, id: txn.id })), cursor: response.meta.endCursor };
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
    retry: 1, // Reduced retry for page load
  });

  // Flatten data for tables
  const cards = cardData?.pages.flatMap((page) => page.items) ?? [];
  const transactions = transactionData?.pages.flatMap((page) => page.items) ?? [];

  // Calculate Stats
  const stats = useMemo(() => {
    const activeCards = cards.filter((c) => c.status === CardStatus.ACTIVE).length;
    return {
      totalCards: cards.length,
      activeCards,
    };
  }, [cards]);

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {" "}
        {/* Use 3 columns for potential future stat */}
        <StatCard title="Total Cards" value={stats.totalCards} icon={<CreditCard size={20} />} />
        <StatCard title="Active Cards" value={stats.activeCards} icon={<CheckCircle size={20} />} />
        {/* Add a third StatCard here later if needed */}
      </div>

      {/* Cards Section */}
      <DataTable
        title="Issued Cards"
        subtitle="Manage your corporate cards"
        headerIcon={<CreditCard size={20} />}
        actionButton={
          <Button
            color="primary"
            variant="solid"
            onPress={() => setIsCreateModalOpen(true)}
            startContent={<PlusIcon className="w-4 h-4" />}
          >
            Issue Card
          </Button>
        }
        aria-label="Issued cards table"
        columns={cardColumns}
        items={cards}
        isLoading={isLoadingCards}
        isError={isErrorCards}
        errorMessage="Failed to load cards"
        emptyContent={
          <EmptyContent message="Issue your first card" type="primary" onAction={() => setIsCreateModalOpen(true)} />
        }
        onRowAction={setSelectedCard}
        isStriped={true}
        isHeaderSticky={true}
      />

      {/* Transactions Section */}
      <DataTable
        title="Card Transactions"
        subtitle="View recent card activity"
        headerIcon={<Activity size={20} />}
        aria-label="Card transactions table"
        columns={transactionColumns}
        items={transactions}
        isLoading={isLoadingTxns}
        isError={isErrorTxns}
        errorMessage="Failed to load transactions"
        emptyContent={<EmptyContent message="No card transactions found" />}
        onRowAction={setSelectedTxn}
        isStriped={true}
        isHeaderSticky={true}
      />

      {/* Modals */}
      <CardDetailsModal card={selectedCard} isOpen={!!selectedCard} onClose={() => setSelectedCard(null)} />
      <CreateCardModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <TransactionDetailsModal
        isOpen={!!selectedTxn}
        transaction={selectedTxn as any}
        onClose={() => setSelectedTxn(null)}
      />
    </div>
  );
}

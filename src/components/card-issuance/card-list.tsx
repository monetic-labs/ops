"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MerchantCardGetOutput, CardStatus, CardLimitFrequency, CardType } from "@backpack-fux/pylon-sdk";

import { DataTable, EmptyContent } from "@/components/generics/data-table";
import { formattedDate } from "@/utils/helpers";
import pylon from "@/libs/pylon-sdk";

import CardDetailsModal from "./card-details";
import CreateCardModal from "./card-create";

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

const cardColumns = [
  {
    name: "CARD NUMBER",
    uid: "lastFour" as const,
    render: (card: HybridCard) => (
      <span className="text-sm truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
        **** **** **** {card.lastFour}
      </span>
    ),
  },
  {
    name: "STATUS",
    uid: "status" as const,
    render: (card: HybridCard) => (
      <span className={`text-sm truncate ${getStatusColor(card.status)}`}>{card.status}</span>
    ),
  },
  {
    name: "CARDHOLDER",
    uid: "cardOwner" as const,
    render: (card: HybridCard) => (
      <span className="text-sm truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">{card.holder}</span>
    ),
  },
  {
    name: "CREATED",
    uid: "createdAt" as const,
    render: (card: HybridCard) => <span className="text-sm truncate">{formattedDate(card.createdAt)}</span>,
  },
];

export default function CardList() {
  const [selectedCard, setSelectedCard] = useState<HybridCard | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery<CardPage>({
    queryKey: ["merchant-cards"],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      try {
        const response = await pylon.getCards({
          after: pageParam as string | undefined,
          limit: 10,
        });

        // Ensure we have a valid response with cards array
        if (!response || !response.cards || !Array.isArray(response.cards)) {
          throw new Error("Invalid response from Pylon SDK");
        }

        // Map and validate each card
        const items = response.cards
          .map((card) => {
            if (!card || typeof card !== "object") {
              console.warn("Invalid card object in response:", card);

              return null;
            }

            try {
              return {
                ...card,
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

        return {
          items,
          cursor: response.meta?.endCursor,
        };
      } catch (error) {
        console.error("Error fetching cards:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage: CardPage) => lastPage.cursor,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const cards = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <DataTable
        aria-label="Card list table"
        columns={cardColumns}
        emptyContent={
          <EmptyContent message="Create your first card" type="primary" onAction={() => setIsCreateModalOpen(true)} />
        }
        errorMessage="Failed to load cards"
        isError={isError}
        isLoading={isLoading}
        items={cards}
        onRowAction={setSelectedCard}
      />

      <CardDetailsModal card={selectedCard} isOpen={!!selectedCard} onClose={() => setSelectedCard(null)} />
      <CreateCardModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
}

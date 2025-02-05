"use client";

import { useState } from "react";
import { Spinner } from "@nextui-org/spinner";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MerchantCardGetOutput, CardStatus, CardLimitFrequency, CardType } from "@backpack-fux/pylon-sdk";

import InfiniteTable from "@/components/generics/table-infinite";
import { formattedDate } from "@/utils/helpers";
import pylon from "@/libs/pylon-sdk";
import CardDetailsModal from "./card-details";

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

export default function CardList() {
  const [selectedCard, setSelectedCard] = useState<HybridCard | null>(null);

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

  if (isError) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <p className="text-white/60">Failed to load cards</p>
      </div>
    );
  }

  if (isLoading && cards.length === 0) {
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
            name: "CARD NUMBER",
            uid: "lastFour",
          },
          {
            name: "STATUS",
            uid: "status",
          },
          {
            name: "CARDHOLDER",
            uid: "cardOwner",
          },
          {
            name: "CREATED",
            uid: "createdAt",
          },
        ]}
        initialData={cards}
        loadMore={async (cursor) => {
          await fetchNextPage();
          const lastPage = data?.pages[data.pages.length - 1];
          return {
            items: lastPage?.items ?? [],
            cursor: lastPage?.cursor,
          };
        }}
        renderCell={(card: HybridCard, columnKey) => {
          if (!card) return null;

          switch (columnKey) {
            case "lastFour":
              return `•••• ${card.lastFour || ""}`;
            case "status":
              return <span className={getStatusColor(card.status)}>{card.status || "Unknown"}</span>;
            case "cardOwner":
              return card.holder || "Unknown";
            case "createdAt":
              return card.createdAt ? formattedDate(card.createdAt) : "Unknown";
            default:
              return null;
          }
        }}
        onRowSelect={setSelectedCard}
        emptyContent="No cards found"
      />

      {selectedCard && <CardDetailsModal isOpen={true} onClose={() => setSelectedCard(null)} card={selectedCard} />}
    </>
  );
}

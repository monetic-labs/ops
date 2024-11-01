import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import React, { useCallback, useEffect, useState } from "react";

import { issuedCardData, issuedCardColumns } from "@/data";
import CardLimitModal from "@/components/card-issuance/card-limit";
import CardDetailsModal from "@/components/card-issuance/card-details";
import { getOpepenAvatar } from "@/utils/helpers";

import InfiniteTable from "../generics/table-infinite";

const statusColorMap: Record<string, "success" | "danger"> = {
  Active: "success",
  Inactive: "danger",
};

type Card = (typeof issuedCardData)[0];
type ColumnKey = keyof Card | "actions";

export default function CardListTable() {
  const [openModal, setOpenModal] = useState<"details" | "limit" | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const newAvatars: Record<string, string> = {};

    issuedCardData.forEach((card) => {
      newAvatars[card.holder] = getOpepenAvatar(card.holder, 32);
    });
    setAvatars(newAvatars);
  }, []);

  const handleOpenDetailsModal = (card: Card) => {
    setSelectedCard(card);
    setOpenModal("details");
  };

  const handleOpenLimitModal = (card: Card) => {
    setSelectedCard(card);
    setOpenModal("limit");
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setSelectedCard(null);
  };

  const handleSaveLimit = (amount: string, cycle: string) => {
    if (selectedCard) {
      console.log(`New limit for ${selectedCard.cardName}: ${amount} per ${cycle}`);
    }
    handleCloseModal();
  };

  const renderCell = useCallback(
    (card: Card, columnKey: keyof Card) => {
      const cellValue = card[columnKey];

      switch (columnKey) {
        case "cardName":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: avatars[card.holder],
              }}
              description={card.holder}
              name={card.cardName}
            />
          );
        case "status":
          return (
            <Chip className="capitalize" color={statusColorMap[card.status]} size="sm" variant="flat">
              {card.status}
            </Chip>
          );
        case "limit":
          return `$${card.limit.amount} per ${card.limit.cycle}`;
        default:
          return cellValue as React.ReactNode;
      }
    },
    [avatars]
  );

  const loadMore = async (cursor: string | undefined) => {
    const pageSize = 10;
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + pageSize;
    const newItems = issuedCardData.slice(startIndex, endIndex);
    const newCursor = endIndex < issuedCardData.length ? endIndex.toString() : undefined;

    return { items: newItems, cursor: newCursor };
  };

  const handleRowSelect = useCallback((card: Card) => {
    setSelectedCard(card);
    setIsDetailsModalOpen(true);
  }, []);

  return (
    <>
      <InfiniteTable
        columns={issuedCardColumns}
        initialData={issuedCardData}
        loadMore={loadMore}
        renderCell={renderCell}
        onRowSelect={handleRowSelect}
      />
      <CardLimitModal
        cardName={selectedCard?.cardName || ""}
        currentLimit={selectedCard?.limit ? `${selectedCard.limit.amount} per ${selectedCard.limit.cycle}` : ""}
        isOpen={openModal === "limit"}
        onClose={handleCloseModal}
        onSave={handleSaveLimit}
      />
      {selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </>
  );
}

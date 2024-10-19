// REFAC THIS LATER
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import React, { useCallback, useEffect, useState } from "react";
import CardLimitModal from "@/components/card-issuance/card-limit";
import CardDetailsModal from "@/components/card-issuance/card-details";
import { getOpepenAvatar } from "@/utils/helpers";
import InfiniteTable from "../generics/table-infinite";
import { MerchantCardGetOutput } from "@backpack-fux/pylon-sdk";
import pylon from "@/libs/pylon-sdk";

type HybridCard = MerchantCardGetOutput["cards"][number] & { avatar?: string; type: string; holder: string };

const cards: HybridCard[] = [];

const statusColorMap: Record<string, "success" | "danger" | "primary" | "default"> = {
  ACTIVE: "success",
  CANCELED: "danger",
  NOT_ACTIVATED: "default",
  LOCKED: "primary",
};

export default function CardListTable() {
  const [selectedCard, setSelectedCard] = useState<HybridCard | null>(null);

  const handleCloseModal = () => {
    setSelectedCard(null);
  };

  const handleSaveLimit = (amount: string, cycle: string) => {
    handleCloseModal();
  };

  const renderCell = useCallback((card: HybridCard, columnKey: keyof HybridCard) => {
    switch (columnKey) {
      case "displayName":
        return (
          <User
            avatarProps={{
              radius: "lg",
              src: card.avatar,
            }}
            description={""}
            name={card.displayName}
          />
        );
      case "status":
        return (
          <Chip className="capitalize" color={statusColorMap[card.status]} size="sm" variant="flat">
            {card.status}
          </Chip>
        );
      case "type": {
        return <p>{card.type}</p>;
      }
      case "holder": {
        return <p>{card.holder}</p>;
      }
      // case "limit":
      //   return `$${card.limit.amount} per ${card.limit.cycle}`;
      default:
        return <></>;
    }
  }, []);

  const loadMore = async (cursor: string | undefined) => {
    try {
      const { cards, meta } = await (cursor && cursor?.length > 1
        ? pylon.getCards({ after: cursor })
        : pylon.getCards({}));
      return {
        items: cards.map((t) => ({
          ...t,
          avatar: getOpepenAvatar(t.id, 20),
          type: t.cardShippingDetails ? "Physical" : "Virtual",
          holder: t?.cardOwner?.firstName + " " + t?.cardOwner?.lastName,
        })),
        cursor: meta.endCursor,
      };
    } catch (error) {
      console.log(error);
      return { items: [], cursor: "" };
    }
  };

  const handleRowSelect = useCallback((card: HybridCard) => {
    setSelectedCard(card);
  }, []);

  return (
    <>
      <InfiniteTable
        columns={[
          { name: "CARD NAME", uid: "displayName" },
          { name: "HOLDER", uid: "holder" },
          { name: "TYPE", uid: "type" },
          { name: "STATUS", uid: "status" },
          // { name: "LIMIT", uid: "limit" },
          //{ name: "ACTIONS", uid: "actions" },
        ]}
        initialData={cards}
        renderCell={renderCell}
        loadMore={loadMore}
        onRowSelect={handleRowSelect}
      />
      {/* <CardLimitModal
        cardName={selectedCard?.displayName || ""}
        // currentLimit={selectedCard?.limit ? `${selectedCard.limit.amount} per ${selectedCard.limit.cycle}` : ""}
        currentLimit=""
        isOpen={openModal === "limit"}
        onClose={handleCloseModal}
        onSave={handleSaveLimit}
      /> */}
      {selectedCard && (
        <CardDetailsModal card={selectedCard} isOpen={Boolean(selectedCard)} onClose={() => setSelectedCard(null)} />
      )}
    </>
  );
}

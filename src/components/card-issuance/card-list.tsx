import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import React, { useCallback, useState } from "react";
import CardDetailsModal from "@/components/card-issuance/card-details";
import { formatNumber, getOpepenAvatar } from "@/utils/helpers";
import { InfiniteTableWithExternalList } from "../generics/table-infinite";
import { MerchantCardGetOutput } from "@backpack-fux/pylon-sdk";
import pylon from "@/libs/pylon-sdk";
import { AsyncListData, useAsyncList } from "@react-stately/data";

type HybridCard = MerchantCardGetOutput["cards"][number] & {
  avatar?: string;
  type: string;
  holder: string;
  limit: number;
  limitFrequency: string;
};

const statusColorMap: Record<string, "success" | "danger" | "primary" | "default"> = {
  ACTIVE: "success",
  CANCELED: "danger",
  NOT_ACTIVATED: "default",
  LOCKED: "primary",
};

export default function CardListTable() {
  const [selectedCard, setSelectedCard] = useState<HybridCard | null>(null);
  const [hasMore, setHasMore] = React.useState(true);

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
      case "limit":
        return `$${formatNumber(card.limit)} per ${card.limitFrequency.toLowerCase()}`;
      default:
        return <></>;
    }
  }, []);

  const list = useAsyncList({
    async load({ cursor }) {
      try {
        const { cards, meta } = await (cursor && cursor?.length > 1
          ? pylon.getCards({ after: cursor })
          : pylon.getCards({}));
        if (meta.endCursor) {
          setHasMore(true);
        } else {
          setHasMore(false);
        }
        return {
          items: cards.map((t) => ({
            ...t,
            avatar: getOpepenAvatar(t.id, 20),
            type: t.cardShippingDetails ? "Physical" : "Virtual",
            holder: t?.cardOwner?.firstName + " " + t?.cardOwner?.lastName,
            limit: t.limit,
            limitFrequency: t.limitFrequency,
          })),
          cursor: meta.endCursor,
        };
      } catch (error) {
        console.log(error);
        setHasMore(false);
        return { items: [], cursor: "" };
      }
    },
  });
  const handleCloseModal = (card: HybridCard) => {
    list.update(card.id, card);
    setSelectedCard(null);
  };

  const handleRowSelect = useCallback((card: HybridCard) => {
    setSelectedCard(card);
  }, []);

  return (
    <>
      <InfiniteTableWithExternalList
        hasMore={hasMore}
        setHasMore={setHasMore}
        list={list as AsyncListData<HybridCard>}
        columns={[
          { name: "CARD NAME", uid: "displayName" },
          { name: "HOLDER", uid: "holder" },
          { name: "TYPE", uid: "type" },
          { name: "LIMIT", uid: "limit" },
          { name: "STATUS", uid: "status" },
        ]}
        renderCell={renderCell}
        onRowSelect={handleRowSelect}
      />

      {selectedCard && (
        <CardDetailsModal card={selectedCard} isOpen={Boolean(selectedCard)} onClose={handleCloseModal} />
      )}
    </>
  );
}

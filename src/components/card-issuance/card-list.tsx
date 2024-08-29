import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/table";
import { Tooltip } from "@nextui-org/tooltip";
import { User } from "@nextui-org/user";
import React, { useState } from "react";

import { cards, cardsColumns } from "@/data";
import CardLimitModal from "@/components/card-issuance/card-limit";
import CardDetailsModal from "@/components/card-issuance/card-details";

const statusColorMap: Record<string, "success" | "danger"> = {
  Active: "success",
  Inactive: "danger",
};

type Card = (typeof cards)[0];
type ColumnKey = keyof Card | "actions";

export default function CardListTable() {
  const [openModal, setOpenModal] = useState<"details" | "limit" | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

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
      console.log(
        `New limit for ${selectedCard.cardName}: ${amount} per ${cycle}`,
      );
      // Here you would update the card's limit in your state or send it to an API
    }
    handleCloseModal();
  };

  const renderCell = React.useCallback((card: Card, columnKey: ColumnKey) => {
    const cellValue = columnKey !== "actions" ? card[columnKey] : null;

    switch (columnKey) {
      case "cardName":
        return (
          <User
            avatarProps={{
              radius: "lg",
              src: `https://i.pravatar.cc/150?u=${card.holder}`,
            }}
            description={card.holder}
            name={card.cardName}
          />
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[card.status]}
            size="sm"
            variant="flat"
          >
            {card.status}
          </Chip>
        );
      case "limit":
        return `$${card.limit.amount} per ${card.limit.cycle}`;
      case "actions":
        return (
          <div className="relative flex items-center justify-center gap-2">
            <Tooltip content="Adjust Limit">
              <Button
                size="sm"
                onPress={() => {
                  handleOpenLimitModal(card);
                }}
              >
                Limit
              </Button>
            </Tooltip>
            <Tooltip content="View Details">
              <Button
                size="sm"
                onPress={() => {
                  handleOpenDetailsModal(card);
                }}
              >
                Details
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return cellValue as React.ReactNode;
    }
  }, []);

  return (
    <>
      <Table aria-label="Example table with custom cells">
        <TableHeader columns={cardsColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={cards}>
          {(item) => (
            <TableRow key={item.cardName}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(item, columnKey as ColumnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <CardLimitModal
        cardName={selectedCard?.cardName || ""}
        currentLimit={
          selectedCard?.limit
            ? `${selectedCard.limit.amount} per ${selectedCard.limit.cycle}`
            : ""
        }
        isOpen={openModal === "limit"}
        onClose={handleCloseModal}
        onSave={handleSaveLimit}
      />

      <CardDetailsModal
        card={selectedCard}
        isOpen={openModal === "details"}
        onClose={handleCloseModal}
      />
    </>
  );
}

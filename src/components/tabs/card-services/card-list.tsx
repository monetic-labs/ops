import { DeleteIcon, EditIcon, EyeIcon } from "@/components/icons";
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
import React from "react";

const columns = [
  { name: "CARD NAME", uid: "cardName" },
  { name: "HOLDER", uid: "holder" },
  { name: "TYPE", uid: "type" },
  { name: "STATUS", uid: "status" },
  { name: "LIMIT", uid: "limit" },
  { name: "ACTIONS", uid: "actions" },
];

const cards = [
  {
    cardName: "General Use",
    holder: "Sterlin Archer",
    type: "Physical",
    status: "Active",
    limit: "$1000 p/day",
    actions: "modal",
  },
  {
    cardName: "Apple",
    holder: "Sterlin Archer",
    type: "Virtual",
    status: "Active",
    limit: "$100 p/month",
    actions: "modal",
  },
  {
    cardName: "Vacation",
    holder: "Sterlin Archer",
    type: "Physical",
    status: "Inactive",
    limit: "$5000 p/day",
    actions: "modal",
  },
];

const statusColorMap: Record<string, "success" | "danger"> = {
  Active: "success",
  Inactive: "danger",
};

export default function CardListTable() {
  const renderCell = React.useCallback(
    (card: (typeof cards)[0], columnKey: keyof (typeof cards)[0]) => {
      const cellValue = card[columnKey];

      switch (columnKey) {
        case "cardName":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: `https://i.pravatar.cc/150?u=${card.holder}`,
              }}
              description={card.holder}
              name={cellValue}>
              {card.cardName}
            </User>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[card.status]}
              size="sm"
              variant="flat">
              {cellValue}
            </Chip>
          );
        case "actions":
          return (
            <div className="relative flex items-center gap-2">
              <Tooltip content="Card Details">
                <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                  <EyeIcon />
                </span>
              </Tooltip>
              <Tooltip content="Edit Card">
                <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                  <EditIcon />
                </span>
              </Tooltip>
              <Tooltip color="danger" content="Delete Card">
                <span className="text-lg text-danger cursor-pointer active:opacity-50">
                  <DeleteIcon />
                </span>
              </Tooltip>
            </div>
          );
        default:
          return cellValue;
      }
    },
    []
  );

  return (
    <Table aria-label="Example table with custom cells">
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}>
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={cards}>
        {(item) => (
          <TableRow key={item.cardName}>
            {(columnKey) => (
              <TableCell>
                {renderCell(item, columnKey as keyof (typeof cards)[0])}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

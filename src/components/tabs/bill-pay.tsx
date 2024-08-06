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
  { name: "VENDOR", uid: "vendor" },
  { name: "INTERNAL NOTE", uid: "internalNote" },
  { name: "MEMO", uid: "memo" },
  { name: "STATUS", uid: "status" },
  { name: "AMOUNT", uid: "amount" },
  { name: "FEES", uid: "fees" },
  { name: "ACTIONS", uid: "actions" },
];

const billPay = [
  {
    vendor: "Acme, LTD",
    internalNote: "ai-generated-note",
    memo: "",
    status: "View",
    amount: "$10,000.00",
    fees: "$200.00",
    actions: "modal",
  },
  {
    vendor: "Design Contractor",
    internalNote: "ai-generated-note",
    memo: "",
    status: "View",
    amount: "$10,000.00",
    fees: "$200.00",
    actions: "modal",
  },
  {
    vendor: "UPS Shipping Account",
    internalNote: "ai-generated-note",
    memo: "Physical",
    status: "Inactive",
    amount: "$5000",
    fees: "$100",
    actions: "modal",
  },
];

const statusColorMap: Record<string, "success" | "danger"> = {
  Active: "success",
  Inactive: "danger",
};

export default function BillPayTable() {
  const renderCell = React.useCallback(
    (card: (typeof billPay)[0], columnKey: keyof (typeof billPay)[0]) => {
      const cellValue = card[columnKey];

      switch (columnKey) {
        case "vendor":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: `https://i.pravatar.cc/150?u=${card.internalNote}`,
              }}
              description={card.internalNote}
              name={cellValue}>
              {card.vendor}
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
      <TableBody items={billPay}>
        {(item) => (
          <TableRow key={item.vendor}>
            {(columnKey) => (
              <TableCell>
                {renderCell(item, columnKey as keyof (typeof billPay)[0])}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

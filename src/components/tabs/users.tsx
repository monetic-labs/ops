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
  { name: "NAME", uid: "name" },
  { name: "ROLE", uid: "role" },
  { name: "EMAIL", uid: "email" },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

const users = [
  {
    name: "Rick Sanchez",
    role: "Admin",
    email: "rick.sanchez@example.com",
    status: "Active",
    actions: "Actions",
  },
  {
    name: "Morty Smith",
    role: "Admin",
    email: "morty.smith@example.com",
    status: "View",
    actions: "modal",
  },
  {
    name: "Summer Smith",
    role: "Admin",
    email: "summer.smith@example.com",
    status: "View",
  },
  {
    name: "Beth Smith",
    role: "Admin",
    email: "beth.smith@example.com",
    status: "View",
  },
];

const statusColorMap: Record<string, "success" | "danger"> = {
  Active: "success",
  Inactive: "danger",
};

export default function UserTab() {
  const renderCell = React.useCallback(
    (card: (typeof users)[0], columnKey: keyof (typeof users)[0]) => {
      const cellValue = card[columnKey];

      switch (columnKey) {
        case "name":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: `https://i.pravatar.cc/150?u=${card.name}`,
              }}
              description={card.name}
              name={cellValue}>
              {card.name}
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
      <TableBody items={users}>
        {(item) => (
          <TableRow key={item.name}>
            {(columnKey) => (
              <TableCell>
                {renderCell(item, columnKey as keyof (typeof users)[0])}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

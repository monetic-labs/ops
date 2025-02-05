import { Chip } from "@nextui-org/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { Tooltip } from "@nextui-org/tooltip";
import { User } from "@nextui-org/user";
import React from "react";

import { DeleteIcon, EditIcon, EyeIcon } from "@/components/icons";

const columns = [
  { name: "NAME", uid: "name" },
  { name: "SERVICES", uid: "services" },
  { name: "TYPE", uid: "type" },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

const compliance = [
  {
    type: "kyc",
    services: "user",
    name: "rick.sanchez@example.com",
    status: "Active",
  },
  {
    type: "kyc",
    services: "user",
    name: "morty.smith@example.com",
    status: "Renew",
  },
  {
    type: "kyb",
    services: "merchant",
    name: "contact@company.com",
    status: "Active",
  },
  {
    type: "kyb",
    services: "merchant",
    name: "contact@anothercompany.com",
    status: "Active",
  },
];

const statusColorMap: Record<string, "success" | "danger"> = {
  Active: "success",
  Inactive: "danger",
};

export default function ComplianceTable() {
  const renderCell = React.useCallback((card: (typeof compliance)[0], columnKey: React.Key) => {
    const cellValue = card[columnKey as keyof (typeof compliance)[0]];

    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{
              radius: "lg",
              src: `https://i.pravatar.cc/150?u=${card.name}`,
            }}
            description={card.type}
            name={cellValue}
          >
            {card.type}
          </User>
        );
      case "status":
        return (
          <Chip className="capitalize" color={statusColorMap[card.status]} size="sm" variant="flat">
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
  }, []);

  return (
    <Table removeWrapper aria-label="Example table with custom cells">
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={compliance}>
        {(item) => (
          <TableRow key={item.name}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey as keyof (typeof compliance)[0])}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

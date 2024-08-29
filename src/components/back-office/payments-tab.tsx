import React from "react";
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
import { Button } from "@nextui-org/button";

const columns = [
  { name: "CUSTOMER", uid: "customer" },
  { name: "PAYMENT STATUS", uid: "paymentStatus" },
  { name: "ORDER ID", uid: "orderId" },
  { name: "TOTAL", uid: "total" },
  { name: "ACTIONS", uid: "actions" },
];

const payments = [
  {
    customer: "John Doe",
    paymentStatus: "Paid",
    orderId: "ORD-001",
    total: "$100.00",
  },
  {
    customer: "Jane Smith",
    paymentStatus: "Pending",
    orderId: "ORD-002",
    total: "$75.50",
  },
  {
    customer: "Bob Johnson",
    paymentStatus: "Failed",
    orderId: "ORD-003",
    total: "$150.00",
  },
];

const statusColorMap: Record<string, "success" | "warning" | "danger"> = {
  Paid: "success",
  Pending: "warning",
  Failed: "danger",
};

export default function PaymentsTab() {
  const renderCell = React.useCallback(
    (payment: (typeof payments)[0], columnKey: React.Key) => {
      const cellValue = payment[columnKey as keyof (typeof payments)[0]];

      switch (columnKey) {
        case "customer":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: `https://i.pravatar.cc/150?u=${payment.orderId}`,
              }}
              description={payment.orderId}
              name={cellValue}
            >
              {payment.customer}
            </User>
          );
        case "paymentStatus":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[payment.paymentStatus]}
              size="sm"
              variant="flat"
            >
              {cellValue}
            </Chip>
          );
        case "actions":
          return (
            <div className="relative flex items-center justify-center">
              <Tooltip content="View Payment Details">
                <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                  <Button size="sm" onPress={() => console.log("View details")}>
                    Details
                  </Button>
                </span>
              </Tooltip>
            </div>
          );
        default:
          return cellValue;
      }
    },
    [],
  );

  return (
    <Table aria-label="Payments table with custom cells">
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={payments}>
        {(item) => (
          <TableRow key={item.orderId}>
            {(columnKey) => (
              <TableCell>
                {renderCell(item, columnKey as keyof (typeof payments)[0])}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

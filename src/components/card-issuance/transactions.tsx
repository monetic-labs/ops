import React, { useState } from "react";
import { Chip } from "@nextui-org/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { Tooltip } from "@nextui-org/tooltip";
import { User } from "@nextui-org/user";
import { Button } from "@nextui-org/button";

import TransactionDetailsModal from "@/components/card-issuance/card-txns";

const columns = [
  { name: "MERCHANT ID", uid: "merchantId" },
  { name: "AMOUNT", uid: "amount" },
  { name: "SPENDER", uid: "spender" },
  { name: "MEMO", uid: "memo" },
  { name: "RECEIPT", uid: "receipt" },
  { name: "ACTIONS", uid: "actions" },
];

const transactions = [
  {
    merchantId: "0001",
    amount: "$100.00",
    spender: "Sterling Archer",
    memo: "some a.i. notes about the transaction",
    receipt: "attach",
    actions: "modal",
    date: "2023-04-15",
    category: "Office Supplies",
    cardName: "Company Card",
    cardLastFour: "1234",
    status: "Completed",
  },
  {
    merchantId: "0002",
    amount: "$100.00",
    spender: "Mallory Archer",
    memo: "some a.i. notes about the transaction",
    receipt: "attach",
    actions: "modal",
    date: "2023-04-15",
    category: "Office Supplies",
    cardName: "Company Card",
    cardLastFour: "1234",
    status: "Completed",
  },
  {
    merchantId: "0003",
    amount: "$100.00",
    spender: "Lana Kane",
    memo: "some a.i. notes about the transaction",
    receipt: "attach",
    actions: "modal",
    date: "2023-04-15",
    category: "Office Supplies",
    cardName: "Company Card",
    cardLastFour: "1234",
    status: "Completed",
  },
];

const statusColorMap: Record<string, "success" | "warning" | "danger"> = {
  Completed: "success",
  Pending: "warning",
  Cancelled: "danger",
};

export default function Transactions() {
  const [selectedTransaction, setSelectedTransaction] = useState<(typeof transactions)[0] | null>(null);

  const renderCell = React.useCallback(
    (transaction: (typeof transactions)[0], columnKey: keyof (typeof transactions)[0]) => {
      const cellValue = transaction[columnKey];

      switch (columnKey) {
        case "merchantId":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: `https://i.pravatar.cc/150?u=${transaction.merchantId}`,
              }}
              description={transaction.merchantId}
              name={cellValue}
            >
              {transaction.merchantId}
            </User>
          );
        case "amount":
          return (
            <Chip className="capitalize" color={statusColorMap[transaction.amount]} size="sm" variant="flat">
              {cellValue}
            </Chip>
          );
        case "actions":
          return (
            <div className="relative flex items-center justify-center">
              <Tooltip content="View Transaction Details">
                <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                  <Button size="sm" onPress={() => setSelectedTransaction(transaction)}>
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
    []
  );

  return (
    <>
      <Table aria-label="Example table with custom cells">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={transactions}>
          {(item) => (
            <TableRow key={item.merchantId}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey as keyof (typeof transactions)[0])}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TransactionDetailsModal
        isOpen={!!selectedTransaction}
        transaction={selectedTransaction || transactions[0]}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
}

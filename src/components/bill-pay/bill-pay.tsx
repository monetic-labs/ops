import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { User } from "@nextui-org/user";
import React, { ReactNode, useState, useMemo } from "react";
import { TransactionListItem } from "@backpack-fux/pylon-sdk";

import BillPayCloneModal from "@/components/bill-pay/bill-clone";
import CreateBillPayModal from "@/components/bill-pay/bill-create";
import BillPayDetailsModal from "@/components/bill-pay/bill-details";
import BillPaySaveModal from "@/components/bill-pay/bill-save";
import { statusColorMap } from "@/data";
import { useOrderManagement } from "@/hooks/orders/useOrderManagement";

export default function BillPayTable() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [selectedBillPay, setSelectedBillPay] = useState<TransactionListItem | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const { transactions, isLoading, error } = useOrderManagement();

  const columns = useMemo(
    () => [
      { name: "ID", uid: "id" },
      { name: "Status", uid: "status" },
      { name: "Processor", uid: "processor" },
      { name: "Payment Method", uid: "paymentMethod" },
      { name: "Total", uid: "total" },
      { name: "Currency", uid: "currency" },
      { name: "Created At", uid: "createdAt" },
      { name: "Actions", uid: "actions" },
    ],
    []
  );

  const renderCell = React.useCallback((transaction: TransactionListItem, columnKey: React.Key): ReactNode => {
    const cellValue = transaction[columnKey as keyof TransactionListItem];

    switch (columnKey) {
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[transaction.status as keyof typeof statusColorMap] || "default"}
            size="sm"
            variant="flat"
          >
            {transaction.status}
          </Chip>
        );
      case "total":
        return `${transaction.total / 100} ${transaction.currency}`;
      case "createdAt":
        return new Date(transaction.createdAt).toLocaleString();
      case "actions":
        return (
          <div className="relative flex items-center justify-center gap-2">
            <Button
              size="sm"
              onPress={() => {
                setSelectedBillPay(transaction);
                setIsDetailsModalOpen(true);
              }}
            >
              Details
            </Button>
            <Button
              size="sm"
              onPress={() => {
                setSelectedBillPay(transaction);
                setIsSaveModalOpen(true);
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              onPress={() => {
                setSelectedBillPay(transaction);
                setIsCloneModalOpen(true);
              }}
            >
              Clone
            </Button>
          </div>
        );
      default:
        return cellValue as ReactNode;
    }
  }, []);

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div className="flex justify-end items-center mb-4">
        <Button color="default" onPress={() => setIsCreateModalOpen(true)}>
          Create Bill Pay
        </Button>
      </div>
      <Table aria-label="Transactions table">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={transactions}>
          {(item) => (
            <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>
          )}
        </TableBody>
      </Table>
      <CreateBillPayModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(newBillPay) => {
          console.log("Creating bill pay:", newBillPay);
          setIsCreateModalOpen(false);
        }}
      />
      {selectedBillPay && (
        <>
          <BillPayDetailsModal
            billPay={selectedBillPay}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
          />
          <BillPaySaveModal
            billPay={selectedBillPay}
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={(updatedBillPay, saveAsTemplate) => {
              console.log("Saving bill pay:", updatedBillPay);
              if (saveAsTemplate) {
                console.log("Saving as template");
                // Implement logic to save as template
              }
              setIsSaveModalOpen(false);
            }}
          />
          <BillPayCloneModal
            billPay={selectedBillPay}
            isOpen={isCloneModalOpen}
            onClose={() => setIsCloneModalOpen(false)}
            onSave={(clonedBillPay) => {
              console.log("Cloning bill pay:", clonedBillPay);
              setIsCloneModalOpen(false);
            }}
          />
        </>
      )}
    </>
  );
}

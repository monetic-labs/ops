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
import { User } from "@nextui-org/user";
import React, { ReactNode, useState } from "react";

import BillPayCloneModal from "@/components/bill-pay/bill-clone";
import CreateBillPayModal from "@/components/bill-pay/bill-create";
import BillPayDetailsModal from "@/components/bill-pay/bill-details";
import BillPaySaveModal from "@/components/bill-pay/bill-save";
import { BillPay, billPayColumns, billPayData, statusColorMap } from "@/data";

export default function BillPayTable() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [selectedBillPay, setSelectedBillPay] = useState<BillPay | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const renderCell = React.useCallback(
    (billPay: BillPay, columnKey: React.Key): ReactNode => {
      const cellValue = billPay[columnKey as keyof BillPay];

      switch (columnKey) {
        case "vendor":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: `https://i.pravatar.cc/150?u=${billPay.internalNote}`,
              }}
              description={billPay.internalNote}
              name={billPay.vendor}
            >
              {billPay.vendor}
            </User>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={
                statusColorMap[billPay.status as keyof typeof statusColorMap]
              }
              size="sm"
              variant="flat"
            >
              {billPay.status}
            </Chip>
          );
        case "actions":
          return (
            <div className="relative flex items-center justify-center gap-2">
              <Button
                size="sm"
                onPress={() => {
                  setSelectedBillPay(billPay);
                  setIsDetailsModalOpen(true);
                }}
              >
                Details
              </Button>
              <Button
                size="sm"
                onPress={() => {
                  setSelectedBillPay(billPay);
                  setIsSaveModalOpen(true);
                }}
              >
                Save
              </Button>
              <Button
                size="sm"
                onPress={() => {
                  setSelectedBillPay(billPay);
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
    },
    [],
  );

  return (
    <>
      <div className="flex justify-end items-center mb-4">
        <Button color="default" onPress={() => setIsCreateModalOpen(true)}>
          Create Bill Pay
        </Button>
      </div>
      <Table aria-label="Bill Pay table">
        <TableHeader columns={billPayColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={billPayData}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(item, columnKey as keyof BillPay)}
                </TableCell>
              )}
            </TableRow>
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

import React, { useCallback, useEffect, useState } from "react";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import BillPayDetailsModal from "@/components/bill-pay/actions/bill-details";
import { BillPay, billPayColumns, billPayData, statusColorMap } from "@/data";
import { getOpepenAvatar } from "@/utils/helpers";

export default function Transfers() {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBillPay, setSelectedBillPay] = useState<BillPay | null>(null);
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    const newAvatars: Record<string, string> = {};
    billPayData.forEach((billPay) => {
      newAvatars[billPay.vendor] = getOpepenAvatar(billPay.vendor, 32);
    });
    setAvatars(newAvatars);
  }, []);

  const handleRowSelect = useCallback((billPay: BillPay) => {
    setSelectedBillPay(billPay);
    setIsDetailsModalOpen(true);
  }, []);

  const renderCell = useCallback(
    (billPay: BillPay, columnKey: React.Key) => {
      const cellValue = billPay[columnKey as keyof BillPay];

      switch (columnKey) {
        case "vendor":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: avatars[billPay.vendor],
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
              color={statusColorMap[billPay.status as keyof typeof statusColorMap]}
              size="sm"
              variant="flat"
            >
              {billPay.status}
            </Chip>
          );
        case "receivingBank":
          return (
            <div>
              <div>Name: {billPay.receivingBank.name}</div>
              <div>Routing: {billPay.receivingBank.routingNumber}</div>
              <div>Account: {billPay.receivingBank.accountNumber}</div>
            </div>
          );
        default:
          return typeof cellValue === "object" ? JSON.stringify(cellValue) : cellValue;
      }
    },
    [avatars]
  );

  return (
    <>
      <Table>
        <TableHeader>
          {billPayColumns.map((column) => (
            <TableColumn key={column.uid}>{column.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {billPayData.map((billPay) => (
            <TableRow
              key={billPay.id}
              onClick={() => handleRowSelect(billPay)}
              className="cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-charyo-500"
            >
              {billPayColumns.map((column) => (
                <TableCell key={column.uid}>{renderCell(billPay, column.uid)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedBillPay && (
        <BillPayDetailsModal
          billPay={selectedBillPay}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </>
  );
}

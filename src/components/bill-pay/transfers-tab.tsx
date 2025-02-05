import React, { useCallback, useEffect, useState } from "react";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { MerchantDisbursementEventGetOutput } from "@backpack-fux/pylon-sdk";

import BillPayDetailsModal from "@/components/bill-pay/bill-actions/details";
import { BillPay, billPayColumns, statusColorMap } from "@/data";
import { getOpepenAvatar, getTimeAgo } from "@/utils/helpers";
import { useGetTransfers } from "@/hooks/bill-pay/useGetTransfers";

export default function Transfers() {
  const { transfers, pagination, isLoading, error, fetchTransfers } = useGetTransfers({});
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<MerchantDisbursementEventGetOutput | null>(null);
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTransfers();
  }, []);

  useEffect(() => {
    const newAvatars: Record<string, string> = {};

    transfers.forEach((transfer) => {
      newAvatars[transfer.id] = getOpepenAvatar(transfer.contact.accountOwnerName, 32);
    });
    setAvatars(newAvatars);
  }, [transfers]);

  const handleRowSelect = useCallback((transfer: MerchantDisbursementEventGetOutput) => {
    setSelectedTransfer(transfer);
    setIsDetailsModalOpen(true);
  }, []);

  const renderCell = useCallback(
    (transfer: MerchantDisbursementEventGetOutput, columnKey: keyof BillPay) => {
      const cellValue = transfer[columnKey as keyof MerchantDisbursementEventGetOutput];

      switch (columnKey) {
        case "accountOwnerName":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: avatars[transfer.id],
              }}
              description={transfer.contact.nickname}
              name={transfer.contact.accountOwnerName}
            >
              {transfer.contact.accountOwnerName}
            </User>
          );
        case "amountOut" && "currencyOut":
          return `$${transfer.amountOut} ${transfer.currencyOut}`;
        case "state":
          return (
            <Chip className="capitalize" color={statusColorMap[transfer.state]} size="sm" variant="flat">
              {transfer.state}
            </Chip>
          );
        case "bankName":
          return (
            <div>
              <div>Name: {transfer.contact.bankName}</div>
              <div>Routing: {transfer.contact.routingNumber}</div>
              <div>Account: {transfer.contact.accountNumber}</div>
            </div>
          );
        case "createdAt":
          return getTimeAgo(transfer.createdAt);
        default:
          return typeof cellValue === "object" ? JSON.stringify(cellValue) : cellValue;
      }
    },
    [avatars]
  );

  return (
    <>
      <Table removeWrapper aria-label="Transfers table">
        <TableHeader>
          {billPayColumns.map((column) => (
            <TableColumn key={column.uid}>{column.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody
          emptyContent={"No transfers found"}
          isLoading={isLoading}
          onError={() => <div>Error fetching transfers</div>}
        >
          {transfers.map((transfer) => (
            <TableRow
              key={transfer.id}
              className="cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-charyo-500"
              onClick={() => handleRowSelect(transfer)}
            >
              {billPayColumns.map((column) => (
                <TableCell key={column.uid}>{renderCell(transfer, column.uid)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedTransfer && (
        <BillPayDetailsModal
          billPay={selectedTransfer}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </>
  );
}

"use client";

import React, { useState } from "react";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { MerchantDisbursementEventGetOutput } from "@backpack-fux/pylon-sdk";
import { Address } from "viem";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import BillPayDetailsModal from "@/components/bill-pay/bill-actions/details";
import CreateBillPayModal from "@/components/bill-pay/bill-actions/create";
import { statusColorMap } from "@/data";
import { getOpepenAvatar, formatNumber, isTesting } from "@/utils/helpers";
import { useGetTransfers } from "@/hooks/bill-pay/useGetTransfers";
import { DEFAULT_NEW_BILL_PAY } from "@/types/bill-pay";
import { MOCK_SETTLEMENT_ADDRESS } from "@/utils/constants";
import { useAccounts } from "@/contexts/AccountContext";

const transferColumns: Column<MerchantDisbursementEventGetOutput>[] = [
  {
    name: "ACCOUNT OWNER",
    uid: "contact.accountOwnerName",
    align: "start",
    render: (transfer: MerchantDisbursementEventGetOutput) => (
      <User
        avatarProps={{
          radius: "lg",
          src: getOpepenAvatar(transfer.contact.accountOwnerName, 32),
        }}
        classNames={{
          name: "truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px]",
          description: "truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px]",
        }}
        description={transfer.contact.nickname}
        name={transfer.contact.accountOwnerName}
      />
    ),
  },
  {
    name: "AMOUNT",
    uid: "contact.amount",
    align: "start",
    render: (transfer: MerchantDisbursementEventGetOutput) => (
      <span className="text-sm truncate">
        ${formatNumber(Number(transfer.amountOut))} {transfer.currencyOut}
      </span>
    ),
  },
  {
    name: "STATUS",
    uid: "contact.status",
    align: "center",
    render: (transfer: MerchantDisbursementEventGetOutput) => (
      <Chip className="capitalize truncate" color={statusColorMap[transfer.state]} size="sm" variant="flat">
        {transfer.state}
      </Chip>
    ),
  },
  {
    name: "BANK NAME",
    uid: "contact.bankName",
    align: "end",
    render: (transfer: MerchantDisbursementEventGetOutput) => (
      <span className="text-sm truncate max-w-[150px] sm:max-w-[200px]">{transfer.contact.bankName}</span>
    ),
  },
  {
    name: "ROUTING",
    uid: "contact.routingNumber",
    align: "end",
    render: (transfer: MerchantDisbursementEventGetOutput) => (
      <span className="text-sm font-mono truncate max-w-[150px] sm:max-w-[200px]">
        {transfer.contact.routingNumber}
      </span>
    ),
  },
  {
    name: "ACCOUNT",
    uid: "contact.accountNumber",
    align: "end",
    render: (transfer: MerchantDisbursementEventGetOutput) => (
      <span className="text-sm font-mono truncate max-w-[150px] sm:max-w-[200px]">
        {transfer.contact.accountNumber}
      </span>
    ),
  },
];

export default function Transfers() {
  const { transfers, isLoading, error } = useGetTransfers({});
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<MerchantDisbursementEventGetOutput | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { user } = useAccounts();
  const settlementAddress = isTesting ? MOCK_SETTLEMENT_ADDRESS : (user?.merchant.settlement.walletAddress as Address);

  return (
    <>
      <DataTable
        aria-label="Transfers table"
        columns={transferColumns}
        emptyContent={
          <EmptyContent
            message="Create your first transfer"
            type="primary"
            onAction={() => setIsCreateModalOpen(true)}
          />
        }
        errorMessage="Failed to load transfers"
        isError={!!error}
        isLoading={isLoading}
        items={transfers}
        onRowAction={(transfer) => {
          setSelectedTransfer(transfer);
          setIsDetailsModalOpen(true);
        }}
      />

      {selectedTransfer && (
        <BillPayDetailsModal
          billPay={selectedTransfer}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}

      <CreateBillPayModal
        billPay={DEFAULT_NEW_BILL_PAY}
        isOpen={isCreateModalOpen}
        setBillPay={() => {}}
        settlementAddress={settlementAddress}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(newBillPay) => {
          console.log("Creating transfer:", newBillPay);
          setIsCreateModalOpen(false);
        }}
      />
    </>
  );
}

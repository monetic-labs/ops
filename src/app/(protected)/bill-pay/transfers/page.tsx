"use client";

import React, { useState } from "react";
import { Chip } from "@heroui/chip";
import { User } from "@heroui/user";
import { Button } from "@heroui/button";
import { Address } from "viem";
import { PlusIcon } from "lucide-react";
import { MerchantDisbursementEventGetOutput } from "@monetic-labs/sdk";
import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import BillPayDetailsModal from "../_components/details";
import CreateBillPayModal from "../_components/create";
import { statusColorMap } from "@/data";
import { getOpepenAvatar, formatAmountUSD, isTesting, formatStringToTitleCase } from "@/utils/helpers";
import { useGetTransfers } from "@/app/(protected)/bill-pay/_hooks/useGetTransfers";
import { DEFAULT_NEW_BILL_PAY } from "@/types/bill-pay";
import { MOCK_SETTLEMENT_ADDRESS } from "@/utils/constants";
import { useUser, AuthStatus } from "@/contexts/UserContext";

// Define columns directly in the page component or move to ./components later
const transferColumns: Column<MerchantDisbursementEventGetOutput>[] = [
  {
    name: "ACCOUNT OWNER",
    uid: "contact.accountOwnerName",
    align: "start",
    allowsSorting: true,
    sortingKey: "contact.accountOwnerName",
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
    allowsSorting: true,
    sortingKey: "amountOut",
    render: (transfer: MerchantDisbursementEventGetOutput) => (
      <span className="text-sm truncate">
        {formatAmountUSD(Number(transfer.amountOut))} {transfer.currencyOut}
      </span>
    ),
  },
  {
    name: "STATUS",
    uid: "contact.status",
    align: "center",
    allowsSorting: true,
    sortingKey: "state",
    render: (transfer: MerchantDisbursementEventGetOutput) => (
      <Chip className="capitalize truncate" color={statusColorMap[transfer.state]} size="sm" variant="flat">
        {formatStringToTitleCase(transfer.state)}
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

export default function BillPayTransfersPage() {
  const { transfers, isLoading, error } = useGetTransfers({});
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<MerchantDisbursementEventGetOutput | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { user, authStatus, isLoading: isAuthLoading } = useUser();
  const isFullyAuthenticated = !isAuthLoading && authStatus === AuthStatus.AUTHENTICATED;

  // Safely derive settlementAddress
  const settlementAccount = user?.merchant.accounts.find((account) => account.isSettlement)?.ledgerAddress as
    | Address
    | undefined;
  const settlementAddress = settlementAccount && !isTesting ? settlementAccount : MOCK_SETTLEMENT_ADDRESS;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Transfers</h2>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => setIsCreateModalOpen(true)}
            // Disable button if not fully authenticated or settlement address is unavailable
            isDisabled={!isFullyAuthenticated || !settlementAddress}
          >
            Create Transfer
          </Button>
        </div>
        <DataTable
          aria-label="Transfers table"
          columns={transferColumns}
          emptyContent={
            <EmptyContent
              message="Create your first transfer"
              type="primary"
              // Only pass onAction if the button should be enabled
              onAction={isFullyAuthenticated && settlementAddress ? () => setIsCreateModalOpen(true) : undefined}
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
          isStriped={true}
          isHeaderSticky={true}
        />
      </div>

      {selectedTransfer && (
        <BillPayDetailsModal
          billPay={selectedTransfer}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}

      {/* Ensure settlementAddress is defined before rendering Create Modal */}
      {isFullyAuthenticated && settlementAddress && (
        <CreateBillPayModal
          billPay={DEFAULT_NEW_BILL_PAY}
          isOpen={isCreateModalOpen}
          setBillPay={() => {}} // Adjust if state needs to be managed differently
          settlementAddress={settlementAddress}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={(newBillPay) => {
            console.log("Creating transfer:", newBillPay);
            // TODO: Add mutation logic here to actually create the transfer
            // and potentially refetch the transfers list
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </>
  );
}

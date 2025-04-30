"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Chip } from "@heroui/chip";
import { User as HeroUser } from "@heroui/user";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Address } from "viem";
import { PlusIcon, ArrowUpRight, Clock, Users2, Send } from "lucide-react";
import {
  MerchantDisbursementEventGetOutput,
  MerchantDisbursementCreateOutput,
  DisbursementState,
} from "@monetic-labs/sdk";

import BillPayDetailsModal from "./_components/details";
import CreateTransferFlow from "./_components/create-transfer-flow";

import { useGetTransfers } from "./_hooks/useGetTransfers";
import { useGetContacts } from "./_hooks/useGetContacts";

import { statusColorMap } from "@/data";
import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { getOpepenAvatar, formatAmountUSD, isTesting, formatStringToTitleCase } from "@/utils/helpers";
import { DEFAULT_NEW_BILL_PAY } from "@/types/bill-pay";
import { MOCK_SETTLEMENT_ADDRESS } from "@/utils/constants";
import { useUser, AuthStatus } from "@/contexts/UserContext";
import { StatCard } from "@/components/generics/stat-card";

// --- Column Definitions ---

// Transfer Columns (from transfers/page.tsx)
const transferColumns: Column<MerchantDisbursementEventGetOutput>[] = [
  {
    name: "ACCOUNT OWNER",
    uid: "contact.accountOwnerName",
    align: "start",
    allowsSorting: true,
    sortingKey: "contact.accountOwnerName",
    render: (transfer: MerchantDisbursementEventGetOutput) => (
      <HeroUser
        avatarProps={{ radius: "lg", src: getOpepenAvatar(transfer.contact.accountOwnerName, 32) }}
        classNames={{
          name: "truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px] font-medium text-foreground",
          description: "truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px] text-foreground-500",
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
      <span className="text-sm truncate text-foreground">
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
      <div className="flex items-center justify-center gap-1.5">
        {/* <span className={`w-2 h-2 rounded-full ${getStatusBgColorClass(transfer.state)}`}></span> */}
        <Chip className="capitalize truncate" color={statusColorMap[transfer.state]} size="sm" variant="flat">
          {formatStringToTitleCase(transfer.state)}
        </Chip>
      </div>
    ),
  },
  // Add other transfer columns as needed (Bank Name, Routing, Account)
  {
    name: "BANK NAME",
    uid: "contact.bankName",
    align: "end",
    render: (t) => (
      <span className="text-sm truncate max-w-[150px] sm:max-w-[200px] text-foreground-600">{t.contact.bankName}</span>
    ),
  },
  {
    name: "ROUTING",
    uid: "contact.routingNumber",
    align: "end",
    render: (t) => (
      <span className="text-sm font-mono truncate max-w-[150px] sm:max-w-[200px] text-foreground-600">
        {t.contact.routingNumber}
      </span>
    ),
  },
  {
    name: "ACCOUNT",
    uid: "contact.accountNumber",
    align: "end",
    render: (t) => (
      <span className="text-sm font-mono truncate max-w-[150px] sm:max-w-[200px] text-foreground-600">
        {t.contact.accountNumber}
      </span>
    ),
  },
];

// Contact Columns (from contacts/page.tsx)
const contactColumns: Column<MerchantDisbursementCreateOutput>[] = [
  {
    name: "NAME",
    uid: "accountOwnerName",
    align: "start",
    render: (contact: MerchantDisbursementCreateOutput) => (
      <HeroUser
        avatarProps={{ radius: "lg", src: getOpepenAvatar(contact.accountOwnerName, 32) }}
        classNames={{
          name: "truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px] font-medium text-foreground",
          description: "truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px] text-foreground-500",
        }}
        description={contact.nickname}
        name={contact.accountOwnerName}
      />
    ),
  },
  {
    name: "METHODS",
    uid: "disbursements",
    align: "start",
    render: (contact: MerchantDisbursementCreateOutput) => (
      <div className="flex flex-wrap gap-1">
        {contact.disbursements.map((disbursement) => (
          <Chip key={disbursement.id} className="capitalize truncate" size="sm" variant="flat">
            {formatStringToTitleCase(disbursement.method)}
          </Chip>
        ))}
      </div>
    ),
  },
  {
    name: "STATUS",
    uid: "isActive",
    align: "end",
    render: (contact: MerchantDisbursementCreateOutput) => (
      <div className="flex items-center justify-end gap-1.5">
        {/* <span className={`w-2 h-2 rounded-full ${contact.isActive ? "bg-success" : "bg-danger"}`}></span> */}
        <Chip className="capitalize truncate" color={contact.isActive ? "success" : "danger"} size="sm" variant="flat">
          {contact.isActive ? "Active" : "Inactive"}
        </Chip>
      </div>
    ),
  },
];

// --- Component ---

export default function BillPayPage() {
  // Hooks
  const { transfers, isLoading: isLoadingTransfers, error: errorTransfers } = useGetTransfers({});
  const { contacts, isLoading: isLoadingContacts, error: errorContacts, fetchContacts } = useGetContacts();
  const { user, authStatus, isLoading: isAuthLoading } = useUser();

  // State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<MerchantDisbursementEventGetOutput | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Derived values
  const isFullyAuthenticated = !isAuthLoading && authStatus === AuthStatus.AUTHENTICATED;
  const settlementAccount = user?.merchant.accounts.find((account) => account.isSettlement)?.ledgerAddress as
    | Address
    | undefined;
  const settlementAddress = settlementAccount && !isTesting ? settlementAccount : MOCK_SETTLEMENT_ADDRESS;
  const canCreateTransfer = isFullyAuthenticated && !!settlementAddress;

  // Stats calculations
  const stats = useMemo(() => {
    const pendingTransfers = transfers?.filter((t) => t.state === "PENDING") || [];
    const pendingAmount = pendingTransfers.reduce((sum, t) => sum + Number(t.amountOut), 0);
    const activeContacts = contacts?.filter((c) => c.isActive) || [];

    return {
      totalTransfers: transfers?.length || 0,
      pendingAmount,
      activeContacts: activeContacts.length,
    };
  }, [transfers, contacts]);

  // Effects
  useEffect(() => {
    // Fetch contacts initially (transfers hook likely fetches automatically)
    fetchContacts({});
  }, [fetchContacts]);

  // Render Logic
  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Transfers" value={stats.totalTransfers} icon={<ArrowUpRight size={20} />} />
        <StatCard title="Pending Amount" value={formatAmountUSD(stats.pendingAmount)} icon={<Clock size={20} />} />
        <StatCard title="Active Contacts" value={stats.activeContacts} icon={<Users2 size={20} />} />
      </div>

      {/* Outgoing Transfers Section */}
      <DataTable
        title="Outgoing Transfers"
        subtitle="Manage your payment transfers"
        headerIcon={<Send size={20} />}
        headerClassName={"bg-primary p-6 " + "[&_h2]:!text-white [&_h2>span]:!text-white [&_p]:!text-white/80"}
        actionButton={
          <Button
            color="primary"
            variant="solid"
            className="bg-white text-primary hover:bg-opacity-90 focus-visible:ring-white"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => setIsCreateModalOpen(true)}
            isDisabled={!canCreateTransfer}
          >
            Create Transfer
          </Button>
        }
        aria-label="Outgoing Transfers Table"
        columns={transferColumns}
        items={transfers}
        isLoading={isLoadingTransfers}
        isError={!!errorTransfers}
        errorMessage="Failed to load transfers"
        emptyContent={
          <EmptyContent
            message="Create your first transfer"
            type="primary"
            onAction={canCreateTransfer ? () => setIsCreateModalOpen(true) : undefined}
          />
        }
        onRowAction={(transfer: MerchantDisbursementEventGetOutput) => {
          setSelectedTransfer(transfer);
          setIsDetailsModalOpen(true);
        }}
        isStriped={true}
        isHeaderSticky={true}
      />

      {/* Contacts Section */}
      <DataTable
        title="Contacts"
        subtitle="Manage your payment recipients"
        headerIcon={<Users2 size={20} />}
        aria-label="Contacts Table"
        columns={contactColumns}
        items={contacts}
        isLoading={isLoadingContacts}
        isError={!!errorContacts}
        errorMessage="Failed to load contacts"
        emptyContent={<EmptyContent message="No contacts found" />}
        isStriped={true}
        isHeaderSticky={true}
      />

      {/* Modals */}
      {selectedTransfer && (
        <BillPayDetailsModal
          billPay={selectedTransfer}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
      {canCreateTransfer && (
        <CreateTransferFlow
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          settlementAddress={settlementAddress}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            // Refresh data
            fetchContacts({});
          }}
        />
      )}
    </div>
  );
}

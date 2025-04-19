"use client";

import React, { useEffect } from "react";
import { Chip } from "@heroui/chip";
import { User } from "@heroui/user";
import { MerchantDisbursementCreateOutput } from "@monetic-labs/sdk";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { formatStringToTitleCase, getOpepenAvatar } from "@/utils/helpers";
import { useGetContacts } from "@/app/(protected)/bill-pay/_hooks/useGetContacts";

// Define columns directly in the page component or move to ./components later
const contactColumns: Column<MerchantDisbursementCreateOutput>[] = [
  {
    name: "NAME",
    uid: "accountOwnerName",
    align: "start",
    render: (contact: MerchantDisbursementCreateOutput) => (
      <User
        avatarProps={{
          radius: "lg",
          src: getOpepenAvatar(contact.accountOwnerName, 32),
        }}
        classNames={{
          name: "truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px]",
          description: "truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px]",
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
      <Chip className="capitalize truncate" color={contact.isActive ? "success" : "danger"} size="sm" variant="flat">
        {contact.isActive ? "Active" : "Inactive"}
      </Chip>
    ),
  },
];

export default function BillPayContactsPage() {
  const { contacts, isLoading, error, fetchContacts } = useGetContacts();

  useEffect(() => {
    fetchContacts({});
  }, [fetchContacts]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Contacts</h2>
        {/* Add Create Contact Button/Modal logic here if needed */}
      </div>
      <DataTable
        aria-label="Contacts table"
        columns={contactColumns}
        items={contacts}
        isLoading={isLoading}
        isError={!!error}
        errorMessage="Failed to load contacts"
        emptyContent={<EmptyContent message="No contacts found" />}
        isStriped={true}
        isHeaderSticky={true}
      />
    </div>
  );
}

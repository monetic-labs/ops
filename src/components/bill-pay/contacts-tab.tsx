"use client";

import React, { useEffect } from "react";
import { Chip } from "@heroui/chip";
import { User } from "@heroui/user";
import { MerchantDisbursementCreateOutput } from "@backpack-fux/pylon-sdk";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { formatStringToTitleCase, getOpepenAvatar } from "@/utils/helpers";
import { useGetContacts } from "@/hooks/bill-pay/useGetContacts";

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

export default function Contacts() {
  const { contacts, isLoading, error, fetchContacts } = useGetContacts();

  useEffect(() => {
    fetchContacts({});
  }, []);

  return (
    <DataTable
      aria-label="Contacts table"
      columns={contactColumns}
      emptyContent={<EmptyContent message="No contacts found" />}
      errorMessage="Failed to load contacts"
      isError={!!error}
      isLoading={isLoading}
      items={contacts}
    />
  );
}

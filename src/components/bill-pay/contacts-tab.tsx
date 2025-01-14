import React, { useCallback, useEffect, useState } from "react";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { MerchantDisbursementCreateOutput } from "@backpack-fux/pylon-sdk";

import { contactColumns } from "@/data";
import { getOpepenAvatar } from "@/utils/helpers";
import { useGetContacts } from "@/hooks/bill-pay/useGetContacts";

export default function Contacts() {
  const { contacts, pagination, isLoading, error, fetchContacts } = useGetContacts();
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchContacts({});
  }, []);

  useEffect(() => {
    const newAvatars: Record<string, string> = {};

    contacts.forEach((contact) => {
      newAvatars[contact.id] = getOpepenAvatar(contact.accountOwnerName, 32);
    });
    setAvatars(newAvatars);
  }, [contacts]);

  const renderCell = useCallback(
    (contact: MerchantDisbursementCreateOutput, columnKey: keyof MerchantDisbursementCreateOutput) => {
      const cellValue = contact[columnKey];

      switch (columnKey) {
        case "accountOwnerName":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: avatars[contact.id],
              }}
              description={contact.nickname}
              name={contact.accountOwnerName}
            >
              {contact.accountOwnerName}
            </User>
          );
        case "disbursements":
          return (
            <div>
              {contact.disbursements.map((disbursement) => (
                <Chip key={disbursement.id} className="capitalize" size="sm" variant="flat">
                  {disbursement.method}
                </Chip>
              ))}
            </div>
          );
        case "isActive":
          return (
            <Chip className="capitalize" color={contact.isActive ? "success" : "danger"} size="sm" variant="flat">
              {contact.isActive ? "Active" : "Inactive"}
            </Chip>
          );
        default:
          return typeof cellValue === "object" ? JSON.stringify(cellValue) : cellValue;
      }
    },
    [avatars]
  );

  return (
    <Table>
      <TableHeader>
        {contactColumns.map((column) => (
          <TableColumn key={column.uid}>{column.name}</TableColumn>
        ))}
      </TableHeader>
      <TableBody
        emptyContent={"No contacts found"}
        isLoading={isLoading}
        onError={() => <div>Error fetching contacts</div>}
      >
        {contacts.map((contact) => (
          <TableRow
            key={contact.id}
            className="cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-charyo-500"
          >
            {contactColumns.map((column) => (
              <TableCell key={column.uid}>{renderCell(contact, column.uid)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import React from "react";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";

const contacts = [
  { name: "Jane Fisher", role: "Senior Developer", status: "Active" },
  { name: "Tony Reichert", role: "CEO", status: "Active" },
  { name: "Zoey Lang", role: "Technical Lead", status: "Paused" },
  { name: "William Howard", role: "Community Manager", status: "Vacation" },
];

export default function Contacts() {
  // Sort contacts alphabetically by name
  const sortedContacts = contacts.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Table selectionMode="single" aria-label="Contacts Table">
      <TableHeader>
        <TableColumn>Name</TableColumn>
        <TableColumn>Role</TableColumn>
        <TableColumn>Status</TableColumn>
      </TableHeader>
      <TableBody>
        {sortedContacts.map((contact) => (
          <TableRow key={contact.name}>
            <TableCell>{contact.name}</TableCell>
            <TableCell>{contact.role}</TableCell>
            <TableCell>{contact.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

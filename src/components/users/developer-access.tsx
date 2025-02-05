"use client";

import { useState } from "react";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@nextui-org/table";

import GenerateApiKeysModal from "@/components/back-office/actions/widgets/api-keys";

const columns = [
  {
    key: "name",
    label: "NAME",
  },
  {
    key: "created",
    label: "CREATED",
  },
  {
    key: "lastUsed",
    label: "LAST USED",
  },
  {
    key: "status",
    label: "STATUS",
  },
];

// Mock data - will be hidden initially
const apiKeys = [
  {
    id: 1,
    name: "Production API Key",
    created: "2024-02-01",
    lastUsed: "2024-02-05",
    status: "Active",
  },
  {
    id: 2,
    name: "Development API Key",
    created: "2024-01-15",
    lastUsed: "2024-02-04",
    status: "Active",
  },
];

export default function DeveloperAccess() {
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  return (
    <div className="relative">
      <div className="opacity-50">
        <Table
          removeWrapper
          aria-label="API keys table"
          classNames={{
            wrapper: "bg-[#1A1A1A]/60 backdrop-blur-sm",
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key} className="text-white/60 text-xs uppercase">
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent="No API keys found (coming soon)" items={[]}>
            {(item: any) => (
              <TableRow key={item.id}>
                {(columnKey: any) => <TableCell>{item[columnKey as keyof typeof item]}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <GenerateApiKeysModal isOpen={isApiKeysModalOpen} onClose={() => setIsApiKeysModalOpen(false)} />
    </div>
  );
}

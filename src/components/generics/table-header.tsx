import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/table";
import { Button } from "@nextui-org/button";
import { PlusIcon } from "lucide-react";

export interface Column<T> {
  name: string;
  uid: keyof T;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  "aria-label": string;
  columns: Column<T>[];
  items: T[];
  isLoading?: boolean;
  emptyContent?: React.ReactNode;
  renderCell?: (item: T, columnKey: keyof T) => React.ReactNode;
  onRowAction?: (item: T) => void;
  selectionMode?: "single" | "multiple" | "none";
  classNames?: {
    wrapper?: string;
    table?: string;
    thead?: string;
    tbody?: string;
    tr?: string;
    th?: string;
    td?: string;
  };
}

export function DataTable<T extends { id: string | number }>({
  "aria-label": ariaLabel,
  columns,
  items,
  isLoading,
  emptyContent,
  renderCell,
  onRowAction,
  selectionMode = "none",
  classNames,
}: DataTableProps<T>) {
  return (
    <Table aria-label={ariaLabel} classNames={classNames} removeWrapper selectionMode={selectionMode}>
      <TableHeader>
        {columns.map((column) => (
          <TableColumn key={String(column.uid)} className="text-sm">
            {column.name}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent={emptyContent} isLoading={isLoading} items={items}>
        {(item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer transition-all hover:bg-default-100/50 dark:hover:bg-charyo-500 text-sm"
            onClick={() => onRowAction?.(item)}
          >
            {columns.map((column) => (
              <TableCell key={String(column.uid)} className="text-sm">
                {column.render ? column.render(item) : renderCell?.(item, column.uid)}
              </TableCell>
            ))}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function EmptyContent({ message, onAction }: { message: string; onAction?: () => void }) {
  return (
    <Button
      className="bg-default-100 hover:bg-default-200 text-foreground"
      radius="lg"
      size="sm"
      variant="flat"
      onPress={onAction}
    >
      {message}
      <PlusIcon className="h-4 w-4 ml-2" />
    </Button>
  );
}

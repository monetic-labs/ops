import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Button } from "@heroui/button";
import { PlusIcon } from "lucide-react";
import { Spinner } from "@heroui/spinner";

export interface Column<T> {
  name: string;
  uid: string;
  render?: (item: T) => React.ReactNode;
  align?: "end" | "center" | "start" | undefined;
}

interface DataTableProps<T> {
  "aria-label": string;
  columns: Column<T>[];
  items: T[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
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
  isError,
  errorMessage = "Failed to load data",
  emptyContent,
  renderCell,
  onRowAction,
  selectionMode = "none",
  classNames,
}: DataTableProps<T>) {
  if (isError) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <p className="text-foreground/60 text-sm">{errorMessage}</p>
      </div>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <Spinner color="current" />
      </div>
    );
  }

  return (
    <Table
      removeWrapper
      aria-label={ariaLabel}
      classNames={{
        wrapper: "bg-content1/50",
        ...classNames,
      }}
      selectionMode={selectionMode}
    >
      <TableHeader>
        {columns.map((column) => (
          <TableColumn
            key={String(column.uid)}
            align={column.align as "end" | "center" | "start" | undefined}
            className="text-xs uppercase text-foreground-500 font-medium"
          >
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
                {column.render ? column.render(item) : renderCell?.(item, column.uid as keyof T)}
              </TableCell>
            ))}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

interface EmptyContentProps {
  message: string;
  onAction?: () => void;
  type?: "default" | "primary";
}

export function EmptyContent({ message, onAction, type = "default" }: EmptyContentProps) {
  const getButtonClasses = () => {
    switch (type) {
      case "primary":
        return "bg-primary/10 hover:bg-primary/20 text-foreground/30 border-primary/20";
      case "default":
        return "bg-content2 hover:bg-content3 text-foreground border-divider";
      default:
        return "bg-content2 hover:bg-content3 text-foreground border-divider";
    }
  };

  if (onAction) {
    return (
      <Button
        className={`${getButtonClasses()} border transition-colors`}
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

  return (
    <div className="w-full flex items-center justify-center">
      <p className={`text-sm ${type === "default" ? "text-foreground/60" : `text-${type}`}`}>{message}</p>
    </div>
  );
}

import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, SortDescriptor } from "@heroui/table";
import { Button } from "@heroui/button";
import { PlusIcon } from "lucide-react";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { Pagination } from "@heroui/pagination";
import { Card, CardHeader, CardBody } from "@heroui/card";

export interface Column<T> {
  name: string;
  uid: string;
  render?: (item: T) => React.ReactNode;
  align?: "end" | "center" | "start" | undefined;
  allowsSorting?: boolean;
  sortingKey?: string;
  headerTooltip?: string;
}

export interface DataTableProps<T> {
  "aria-label": string;
  columns: Column<T>[];
  items: T[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyContent?: React.ReactNode;
  renderCell?: (item: T, columnKey: string) => React.ReactNode;
  onRowAction?: (item: T) => void;
  selectionMode?: "single" | "multiple" | "none";
  isStriped?: boolean;
  isHeaderSticky?: boolean;
  isCompact?: boolean;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  enableSorting?: boolean;
  enablePagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  classNames?: {
    wrapper?: string;
    table?: string;
    thead?: string;
    tbody?: string;
    tr?: string;
    th?: string;
    td?: string;
    paginationBase?: string;
    paginationWrapper?: string;
    paginationPrev?: string;
    paginationNext?: string;
    paginationItem?: string;
    paginationCursor?: string;
    paginationEllipsis?: string;
  };
  title?: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  headerIcon?: React.ReactNode;
  headerClassName?: string;
  cardClassName?: string;
}

export function DataTable<T extends { id: string | number | bigint }>({
  columns,
  items,
  isLoading,
  isError,
  errorMessage = "Failed to load data",
  emptyContent,
  renderCell,
  onRowAction,
  selectionMode = "none",
  isStriped = false,
  isHeaderSticky = false,
  isCompact = false,
  sortDescriptor,
  onSortChange,
  enableSorting = false,
  enablePagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  rowsPerPage = 10,
  rowsPerPageOptions = [5, 10, 15, 20, 50],
  onRowsPerPageChange,
  classNames,
  title,
  subtitle,
  actionButton,
  headerIcon,
  headerClassName = "bg-content2 p-6 border-b border-default",
  cardClassName = "shadow-sm border border-default overflow-hidden",
  "aria-label": ariaLabelProp,
}: DataTableProps<T>) {
  const shouldRenderCard = !!(title || actionButton);
  const ariaLabel = title ? `${title.toLowerCase().replace(/\s+/g, "-")}-table` : ariaLabelProp;

  if (isError) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <p className="text-foreground/60 text-sm">{errorMessage}</p>
      </div>
    );
  }

  const defaultWrapperClass = shouldRenderCard
    ? "bg-transparent"
    : "bg-content1/90 border border-divider rounded-lg shadow-sm";

  const defaultTrClass = `group ${isCompact ? "h-10" : "h-14"} hover:bg-content2 transition-colors`;

  const tableElement = (
    <Table
      aria-label={ariaLabel}
      classNames={{
        wrapper: classNames?.wrapper ?? defaultWrapperClass,
        th:
          classNames?.th ??
          `text-xs uppercase text-foreground/70 font-medium bg-transparent ${isCompact ? "py-2 px-3" : "py-3 px-4"}`,
        td: classNames?.td ?? `text-sm ${isCompact ? "py-2 px-3" : "py-4 px-4"}`,
        table: classNames?.table ?? "min-w-full",
        thead: classNames?.thead ?? (isHeaderSticky ? "sticky top-0 z-10 bg-content1/80 backdrop-blur-md" : ""),
        tbody: classNames?.tbody ?? "",
        tr: classNames?.tr ?? defaultTrClass,
      }}
      selectionMode={selectionMode}
      isStriped={isStriped}
      isHeaderSticky={isHeaderSticky}
      isCompact={isCompact}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.uid} align={column.align}>
            {column.headerTooltip ? (
              <Tooltip content={column.headerTooltip} delay={300}>
                <span>{column.name}</span>
              </Tooltip>
            ) : (
              <span>{column.name}</span>
            )}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        items={items}
        emptyContent={emptyContent ?? "No items to display."}
        isLoading={isLoading}
        loadingContent={
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20">
            <Spinner label="Loading..." color="primary" />
          </div>
        }
      >
        {(item) => (
          <TableRow key={String(item.id)} onClick={onRowAction ? () => onRowAction(item) : undefined}>
            {columns.map((column) => (
              <TableCell key={column.uid}>
                {column.render
                  ? column.render(item)
                  : renderCell
                    ? renderCell(item, column.uid)
                    : (item[column.uid as keyof T] as React.ReactNode)}
              </TableCell>
            ))}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (shouldRenderCard) {
    return (
      <Card className={cardClassName}>
        <CardHeader className={headerClassName}>
          <div className="flex justify-between items-center w-full">
            <div>
              {title && (
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  {headerIcon && <span className="text-foreground/80 flex-shrink-0">{headerIcon}</span>}
                  <span>{title}</span>
                </h2>
              )}
              {subtitle && (
                <p className="text-foreground-500 text-sm mt-1 {headerIcon ? 'pl-[calc(size_of_icon_+_gap)]' : ''}">
                  {subtitle}
                </p>
              )}
            </div>
            {actionButton && <div className="ml-auto pl-4">{actionButton}</div>}
          </div>
        </CardHeader>
        <CardBody className="p-0">{tableElement}</CardBody>
      </Card>
    );
  } else {
    return tableElement;
  }
}

interface EmptyContentProps {
  message: string;
  onAction?: () => void;
  type?: "default" | "primary";
  icon?: React.ReactNode;
}

export function EmptyContent({ message, onAction, type = "default", icon }: EmptyContentProps) {
  const getButtonClasses = () => {
    switch (type) {
      case "primary":
        return "bg-primary/10 hover:bg-primary/20 text-foreground/60 border-primary/20";
      case "default":
        return "bg-content2 hover:bg-content3 text-foreground/60 border-divider";
      default:
        return "bg-content2 hover:bg-content3 text-foreground/60 border-divider";
    }
  };

  if (onAction) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        {icon}
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
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-8 gap-2">
      {icon}
      <p className={`text-sm ${type === "default" ? "text-foreground/60" : `text-${type}`}`}>{message}</p>
    </div>
  );
}

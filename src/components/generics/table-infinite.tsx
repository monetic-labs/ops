import React, { ReactNode } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/table";
import { Spinner } from "@nextui-org/spinner";
import { useInfiniteScroll } from "@nextui-org/use-infinite-scroll";
import { AsyncListData, useAsyncList } from "@react-stately/data";

interface Column<T> {
  readonly name: string;
  readonly uid: keyof T;
}

interface InfiniteTableProps<T> {
  columns: readonly Column<T>[];
  initialData: T[];
  renderCell: (item: T, columnKey: keyof T) => ReactNode;
  loadMore: (cursor: string | undefined) => Promise<{ items: T[]; cursor: string | undefined }>;
  onRowSelect?: (item: T) => void;
  emptyContent?: ReactNode;
}

interface InfiniteTableWithExternalListProps<T> {
  columns: readonly Column<T>[];
  renderCell: (item: T, columnKey: keyof T) => ReactNode;
  onRowSelect?: (item: T) => void;
  list: AsyncListData<T>;
  hasMore: boolean;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  emptyContent?: ReactNode;
}

export default function InfiniteTable<T extends { id: string }>({
  columns,
  initialData,
  renderCell,
  loadMore,
  onRowSelect,
  emptyContent,
}: InfiniteTableProps<T>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const list = useAsyncList<T>({
    async load({ cursor }) {
      setIsLoading(true);
      try {
        if (!cursor) {
          setIsLoading(false);
          setHasMore(true);

          return { items: initialData, cursor: initialData.length.toString() };
        }
        const { items, cursor: newCursor } = await loadMore(cursor);

        setHasMore(!!newCursor);

        return { items, cursor: newCursor };
      } finally {
        setIsLoading(false);
      }
    },
  });

  const [loaderRef, scrollerRef] = useInfiniteScroll({
    hasMore,
    onLoadMore: list.loadMore,
  });

  return (
    <Table
      isHeaderSticky
      removeWrapper
      aria-label="Generic table with infinite scroll"
      baseRef={scrollerRef}
      bottomContent={
        hasMore ? (
          <div className="flex justify-center items-center py-4">
            <Spinner ref={loaderRef} color="primary" />
          </div>
        ) : null
      }
      classNames={{
        wrapper: "max-h-[400px]",
      }}
      selectionMode="single"
      onRowAction={(key) => onRowSelect && onRowSelect(list.items.find((item) => item.id === key) as T)}
    >
      <TableHeader columns={columns as Column<T>[]}>
        {(column) => <TableColumn key={column.uid.toString()}>{column.name}</TableColumn>}
      </TableHeader>
      <TableBody
        emptyContent={emptyContent}
        items={list.items}
        loadingContent={<Spinner color="primary" />}
        onError={() => <div>Error fetching transfers</div>}
      >
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey as keyof T)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function InfiniteTableWithExternalList<T extends { id: string }>({
  columns,
  renderCell,
  onRowSelect,
  list,
  hasMore,
  emptyContent,
}: InfiniteTableWithExternalListProps<T>) {
  const [loaderRef, scrollerRef] = useInfiniteScroll({
    hasMore,
    onLoadMore: list.loadMore,
  });

  return (
    <Table
      isHeaderSticky
      removeWrapper
      aria-label="Generic table with infinite scroll"
      baseRef={scrollerRef}
      bottomContent={
        hasMore ? (
          <div className="flex justify-center items-center py-4">
            <Spinner ref={loaderRef} color="primary" />
          </div>
        ) : null
      }
      classNames={{
        wrapper: "max-h-[400px]",
      }}
      selectionMode="single"
      onRowAction={(key) => onRowSelect && onRowSelect(list.items.find((item) => item.id === key) as T)}
    >
      <TableHeader columns={columns as Column<T>[]}>
        {(column) => <TableColumn key={column.uid.toString()}>{column.name}</TableColumn>}
      </TableHeader>
      <TableBody
        emptyContent={emptyContent}
        items={list.items}
        loadingContent={<Spinner color="primary" />}
        onError={() => <div>Error fetching transfers</div>}
      >
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey as keyof T)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

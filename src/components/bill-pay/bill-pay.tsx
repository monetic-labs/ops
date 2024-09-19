
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { User } from "@nextui-org/user";
import React, { ReactNode, useCallback, useEffect, useState } from "react";

import CreateBillPayModal from "@/components/bill-pay/bill-create";
import BillPayDetailsModal from "@/components/bill-pay/bill-details";
import { BillPay, billPayColumns, billPayData, statusColorMap } from "@/data";
import { getOpepenAvatar } from "@/utils/helpers";
import { useInfiniteScroll } from "@nextui-org/use-infinite-scroll";
import { useAsyncList } from "@react-stately/data";
import { Spinner } from "@nextui-org/spinner";

export default function BillPayTable() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBillPay, setSelectedBillPay] = useState<BillPay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Generate avatars on the client side
    const newAvatars: Record<string, string> = {};
    billPayData.forEach((billPay) => {
      newAvatars[billPay.vendor] = getOpepenAvatar(billPay.vendor, 32);
    });
    setAvatars(newAvatars);
  }, []);

  const renderCell = useCallback((billPay: BillPay, columnKey: React.Key): ReactNode => {
    const cellValue = billPay[columnKey as keyof BillPay];

    switch (columnKey) {
      case "vendor":
        return (
          <User
            avatarProps={{
              radius: "lg",
              src: avatars[billPay.vendor],
            }}
            description={billPay.internalNote}
            name={billPay.vendor}
          >
            {billPay.vendor}
          </User>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[billPay.status as keyof typeof statusColorMap]}
            size="sm"
            variant="flat"
          >
            {billPay.status}
          </Chip>
        );
      default:
        return cellValue as ReactNode;
    }
  }, []);

  let list = useAsyncList({
    async load({signal, cursor}) {

      if (cursor) {
        setIsLoading(false);
      }

      // If no cursor is available, then we're loading the first page.
      // Otherwise, the cursor is the next URL to load, as returned from the previous page.
      const res = await fetch(cursor || "https://swapi.py4e.com/api/people/?search=", {signal});
      let json = await res.json();

      setHasMore(json.next !== null);

      return {
        items: json.results,
        cursor: json.next,
      };
    },
  });

  const [loaderRef, scrollerRef] = useInfiniteScroll({hasMore, onLoadMore: list.loadMore});

  return (
    <>
      <div className="flex justify-end items-center mb-4">
        <Button color="default" onPress={() => setIsCreateModalOpen(true)}>
          + New
        </Button>
      </div>
      <Table 
      isHeaderSticky
      aria-label="Bill Pay table"
      baseRef={scrollerRef}
      bottomContent={hasMore ? (
      <div className="flex justify-center items-center py-4">
        <Spinner ref={loaderRef} color="white" />
      </div>
        ) : null}
      className="cursor-pointer" 
      classNames={{
        tr: "transition-colors hover:bg-ualert-500/60 data-[hover=true]:bg-ualert-500/40 rounded-lg"
      }}
      >
        <TableHeader columns={billPayColumns}>
          {(column) => (
            <TableColumn 
            key={column.uid} 
            align={column.uid === "actions" ? "center" : "start"}
            className={column.uid === "memo" || column.uid === "internalNote" ? "hidden md:table-cell" : ""}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={billPayData}>
          {(item) => (
            <TableRow 
            key={item.id}
            onClick={() => {
              setSelectedBillPay(item);
              setIsDetailsModalOpen(true);
            }}
            >
              {(columnKey) => (
                <TableCell 
                  className={columnKey === "memo" || columnKey === "internalNote" ? "hidden md:table-cell" : ""}
                >
                  {renderCell(item, columnKey as keyof BillPay)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <CreateBillPayModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(newBillPay) => {
          console.log("Creating bill pay:", newBillPay);
          setIsCreateModalOpen(false);
        }}
      />
      {selectedBillPay && (
        <>
          <BillPayDetailsModal
            billPay={selectedBillPay}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
          />
        </>
      )}
    </>
  );
}

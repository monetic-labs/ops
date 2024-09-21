
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import React, { ReactNode, useCallback, useEffect, useState } from "react";

import CreateBillPayModal from "@/components/bill-pay/bill-create";
import BillPayDetailsModal from "@/components/bill-pay/bill-details";
import { BillPay, billPayColumns, billPayData, statusColorMap } from "@/data";
import { getOpepenAvatar } from "@/utils/helpers";
import InfiniteTable from "@/components/generics/table-infinite";

export default function BillPayTable() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBillPay, setSelectedBillPay] = useState<BillPay | null>(null);
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    const newAvatars: Record<string, string> = {};
    billPayData.forEach((billPay) => {
      newAvatars[billPay.vendor] = getOpepenAvatar(billPay.vendor, 32);
    });
    setAvatars(newAvatars);
  }, []);

  const handleRowSelect = useCallback((billPay: BillPay) => {
    setSelectedBillPay(billPay);
    setIsDetailsModalOpen(true);
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
  }, [avatars]);

  const loadMore = async (cursor: string | undefined) => {
    const pageSize = 3;
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + pageSize;
    const newItems = billPayData.slice(startIndex, endIndex);
    const newCursor = endIndex < billPayData.length ? endIndex.toString() : undefined;
    
    return { items: newItems, cursor: newCursor };
  };

  return (
    <>
      <div className="flex justify-end items-center mb-4">
        <Button color="default" onPress={() => setIsCreateModalOpen(true)}>
          + New
        </Button>
      </div>
      <InfiniteTable
        columns={billPayColumns}
        initialData={billPayData.slice(0, 3)} // Load first 3 items initially
        renderCell={renderCell}
        loadMore={loadMore}
        onRowSelect={handleRowSelect}
      />
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


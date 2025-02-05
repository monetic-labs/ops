import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@nextui-org/button";
import { Snippet } from "@nextui-org/snippet";
import { GetOrderLinksOutput } from "@backpack-fux/pylon-sdk";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/table";
import { formatPhoneNumber, formatNumber } from "@/utils/helpers";
import Countdown from "@/components/generics/countdown";
import pylon from "@/libs/pylon-sdk";
import { PlusIcon } from "lucide-react";

export interface OrdersTabRef {
  refresh: () => Promise<void>;
}

interface OrdersTabProps {
  onCreateClick: () => void;
}

const OrdersTab = forwardRef<OrdersTabRef, OrdersTabProps>(({ onCreateClick }, ref) => {
  const [currentOrders, setCurrentOrders] = useState<GetOrderLinksOutput[]>([]);

  const fetchCurrentOrders = async () => {
    try {
      const orders = await pylon.getOrderLinks();
      setCurrentOrders(orders);
    } catch (err) {
      console.error("Failed to fetch current orders:", err);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchCurrentOrders,
  }));

  useEffect(() => {
    fetchCurrentOrders();
  }, []);

  const handleDeleteOrder = async (orderLink: string) => {
    const orderId = orderLink.substring(orderLink.lastIndexOf("/") + 1);

    try {
      await pylon.deleteOrderLink(orderId);
      setCurrentOrders(currentOrders.filter((order) => order.id !== orderLink));
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const columns = [
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "amount", label: "Amount" },
    { key: "expires", label: "Expires" },
    { key: "link", label: "Link" },
    { key: "actions", label: "Actions", align: "end" },
  ];

  const renderEmptyContent = () => (
    <Button className="bg-charyo-500/60 backdrop-blur-sm border border-white/5" onPress={onCreateClick}>
      Create your first order
      <PlusIcon size={18} />
    </Button>
  );

  return (
    <Table
      removeWrapper
      aria-label="Orders table"
      classNames={{
        wrapper: "bg-default-100/50",
      }}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key} align={column.align as "end" | "center" | "start" | undefined}>
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={renderEmptyContent()} items={currentOrders}>
        {(order) => (
          <TableRow key={order.id}>
            <TableCell>{order.customer.email}</TableCell>
            <TableCell>{formatPhoneNumber(order.customer.phone)}</TableCell>
            <TableCell>
              ${formatNumber(order.order.subtotal)} {order.order.currency}
            </TableCell>
            <TableCell>
              <Countdown expiresAt={order.expiresAt} />
            </TableCell>
            <TableCell>
              <Snippet
                hideSymbol
                size="sm"
                variant="flat"
                classNames={{
                  base: "bg-default-200",
                  pre: "text-xs",
                }}
              >
                {order.id}
              </Snippet>
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <Button color="danger" variant="flat" size="sm" onPress={() => handleDeleteOrder(order.id)}>
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
});

OrdersTab.displayName = "OrdersTab";

export default OrdersTab;

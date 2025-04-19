import React, { forwardRef, useState } from "react";
import { Button } from "@heroui/button";
import { Snippet } from "@heroui/snippet";
import { GetOrderLinksOutput } from "@monetic-labs/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { formatPhoneNumber, formatAmountUSD } from "@/utils/helpers";
import Countdown from "@/components/generics/countdown";
import CreateOrderModal from "@/components/back-office/actions/order-create";
import pylon from "@/libs/pylon-sdk";

export interface OrdersTabRef {
  refresh: () => Promise<void>;
}

const OrdersTab = forwardRef<OrdersTabRef>((_, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Query for fetching orders
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const orders = await pylon.getOrderLinks();

      return orders;
    },
  });

  // Mutation for deleting orders
  const deleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const id = orderId.substring(orderId.lastIndexOf("/") + 1);

      await pylon.deleteOrderLink(id);

      return orderId;
    },
    onMutate: async (orderId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["orders"] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<GetOrderLinksOutput[]>(["orders"]);

      // Optimistically update to the new value
      queryClient.setQueryData<GetOrderLinksOutput[]>(["orders"], (old = []) =>
        old.filter((order) => order.id !== orderId)
      );

      // Return a context object with the snapshotted value
      return { previousOrders };
    },
    onError: (err, orderId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["orders"], context?.previousOrders);
      console.error("Failed to delete order:", err);
    },
    onSettled: () => {
      // Always refetch after error or success to make sure our local data is correct
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const handleDeleteOrder = (orderId: string) => {
    deleteMutation.mutate(orderId);
  };

  const orderColumns: Column<GetOrderLinksOutput>[] = [
    {
      name: "EMAIL",
      uid: "customer.email",
      align: "start",
      render: (order) => (
        <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px] block">{order.customer.email}</span>
      ),
    },
    {
      name: "PHONE",
      uid: "customer.phone",
      align: "start",
      render: (order) => <span className="truncate block">{formatPhoneNumber(order.customer.phone)}</span>,
    },
    {
      name: "AMOUNT",
      uid: "order.subtotal",
      align: "start",
      render: (order) => (
        <span className="truncate block">
          {formatAmountUSD(order.order.subtotal / 100)} {order.order.currency}
        </span>
      ),
    },
    {
      name: "EXPIRES",
      uid: "expiresAt",
      align: "start",
      render: (order) => (
        <span className="truncate block">
          <Countdown expiresAt={order.expiresAt} />
        </span>
      ),
    },
    {
      name: "LINK",
      uid: "order.link",
      align: "start",
      render: (order) => (
        <Snippet
          hideSymbol
          classNames={{
            base: "bg-default-200 max-w-[150px] sm:max-w-[200px]",
            pre: "text-xs truncate",
          }}
          size="sm"
          variant="flat"
        >
          {order.id}
        </Snippet>
      ),
    },
    {
      name: "ACTIONS",
      uid: "order.actions",
      align: "end",
      render: (order) => (
        <div className="flex justify-end">
          <Button color="danger" size="sm" variant="flat" onPress={() => handleDeleteOrder(order.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Mutation for creating orders
  const createMutation = useMutation({
    mutationFn: async (newOrder: GetOrderLinksOutput) => {
      // The actual API call is handled in the CreateOrderModal
      return newOrder;
    },
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const previousOrders = queryClient.getQueryData<GetOrderLinksOutput[]>(["orders"]);

      queryClient.setQueryData<GetOrderLinksOutput[]>(["orders"], (old = []) => [newOrder, ...old]);

      return { previousOrders };
    },
    onError: (err, newOrder, context) => {
      queryClient.setQueryData(["orders"], context?.previousOrders);
      console.error("Failed to create order:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Expose refresh method via ref
  React.useImperativeHandle(ref, () => ({
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  }));

  const handleOrderCreated = async (newOrder: GetOrderLinksOutput) => {
    createMutation.mutate(newOrder);
    setIsModalOpen(false);
  };

  return (
    <>
      <DataTable
        aria-label="Orders table"
        columns={orderColumns}
        emptyContent={
          <EmptyContent message="Create your first order" type="primary" onAction={() => setIsModalOpen(true)} />
        }
        errorMessage="Failed to load orders"
        isError={!!error}
        isLoading={isLoading}
        items={orders}
      />

      <CreateOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleOrderCreated} />
    </>
  );
});

OrdersTab.displayName = "OrdersTab";

export default OrdersTab;

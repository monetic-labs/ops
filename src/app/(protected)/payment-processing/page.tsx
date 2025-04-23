"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { PlusIcon, Copy, Trash2 } from "lucide-react";
import { Snippet } from "@heroui/snippet";
import { TransactionListItem, GetOrderLinksOutput, BillingAddress } from "@monetic-labs/sdk";
import { useQueryClient, useQuery } from "@tanstack/react-query";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { paymentsStatusColorMap } from "@/data";
import {
  formatAmountUSD,
  formatStringToTitleCase,
  getTimeAgo,
  formatPhoneNumber,
  centsToDollars,
  mapCurrencyToSymbol,
} from "@/utils/helpers";
import Countdown from "@/components/generics/countdown";
import CreateOrderModal from "./_components/order-create";
import { useOrderManagement } from "@/hooks/orders/useOrderManagement";
import pylon from "@/libs/monetic-sdk";

// Import Detail Modals
import { PaymentDetails } from "./_components/order-details";

const paymentHistoryColumns: Column<TransactionListItem>[] = [
  {
    name: "STATUS",
    uid: "transactionStatusHistory",
    render: (payment: TransactionListItem) => {
      const statusLength = payment.transactionStatusHistory.length;
      const lastStatus = statusLength > 0 ? payment.transactionStatusHistory[statusLength - 1].status : "UNKNOWN";

      return (
        <Chip
          className="capitalize truncate"
          color={paymentsStatusColorMap[lastStatus] || "default"}
          size="sm"
          variant="flat"
        >
          {formatStringToTitleCase(lastStatus)}
        </Chip>
      );
    },
  },
  {
    name: "DATE",
    uid: "createdAt",
    allowsSorting: true,
    render: (payment: TransactionListItem) => (
      <span className="truncate block text-sm">{getTimeAgo(payment.createdAt)}</span>
    ),
  },
  {
    name: "CUSTOMER",
    uid: "customer",
    render: (payment: TransactionListItem) => {
      let detail = "N/A";
      const billingAddr = payment.billingAddress as BillingAddress | undefined;
      if (billingAddr?.firstName || billingAddr?.lastName) {
        detail = `${billingAddr.firstName || ""} ${billingAddr.lastName || ""}`.trim();
      }
      return <span className="truncate block text-sm max-w-[150px] sm:max-w-[200px]">{detail || "N/A"}</span>;
    },
  },
  {
    name: "AMOUNT",
    uid: "total",
    allowsSorting: true,
    render: (payment: TransactionListItem) => (
      <span className="truncate block text-sm font-medium">{formatAmountUSD(payment.total / 100)}</span>
    ),
  },
  {
    name: "PAYMENT METHOD",
    uid: "paymentMethod",
    // Hide on mobile (screens smaller than sm breakpoint)
    render: (payment: TransactionListItem) => (
      <span className="hidden sm:table-cell truncate text-sm max-w-[100px]">
        {formatStringToTitleCase(payment.paymentMethod)}
      </span>
    ),
  },
];

export default function PaymentProcessingPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [temporaryRequests, setTemporaryRequests] = useState<GetOrderLinksOutput[]>([]);
  const queryClient = useQueryClient();

  // State for viewing payment details
  const [selectedPayment, setSelectedPayment] = useState<TransactionListItem | null>(null);

  // Fetch Payment History
  const { transactions, isLoading: isLoadingHistory, error: errorHistory } = useOrderManagement();

  // --- Fetch Existing Active Order Links ---
  const {
    data: fetchedActiveLinks = [],
    isLoading: isLoadingLinks,
    error: errorLinks,
  } = useQuery<GetOrderLinksOutput[], Error>({
    queryKey: ["activeOrderLinks"],
    queryFn: async () => {
      const links = await pylon.getOrderLinks();
      // Filter potentially expired links fetched from API if API doesn't pre-filter
      const now = Date.now();
      return links.filter((link) => new Date(link.expiresAt).getTime() > now);
    },
    // Optional: Add refetch interval if needed, though create/delete should handle updates
    // refetchInterval: 60000, // Example: refetch every minute
  });

  // --- Combine and Filter Active Requests ---
  const activeRequests = useMemo(() => {
    const now = Date.now();
    // Filter temporary requests just in case interval hasn't run
    const validTemporary = temporaryRequests.filter((req) => new Date(req.expiresAt).getTime() > now);

    // Combine fetched and temporary, ensuring uniqueness based on ID
    const combined = [...fetchedActiveLinks];
    const fetchedIds = new Set(fetchedActiveLinks.map((link) => link.id));

    validTemporary.forEach((tempReq) => {
      if (!fetchedIds.has(tempReq.id)) {
        combined.push(tempReq);
      }
    });

    // Sort by expiration, soonest expiring first (optional)
    // combined.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());

    return combined;
  }, [fetchedActiveLinks, temporaryRequests]);

  // Effect to remove expired temporary requests
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTemporaryRequests((prevRequests) => prevRequests.filter((req) => new Date(req.expiresAt).getTime() > now));
    }, 30 * 1000); // Check every 30 seconds

    // Initial check on mount
    const now = Date.now();
    setTemporaryRequests((prevRequests) => prevRequests.filter((req) => new Date(req.expiresAt).getTime() > now));

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Handler for successful request creation
  const handleOrderCreated = async (newOrder: GetOrderLinksOutput) => {
    // Add to top for visibility
    setTemporaryRequests((prev) => [newOrder, ...prev]);
    setIsCreateModalOpen(false);
  };

  // --- Handlers for Payment History Details ---
  const handleViewDetails = (payment: TransactionListItem) => {
    setSelectedPayment(payment);
  };

  const handleCloseModal = () => {
    setSelectedPayment(null);
  };

  // --- Handler for Deleting Payment Requests (Updated) ---
  const handleDeleteRequest = async (requestId: string) => {
    const actualId = requestId.substring(requestId.lastIndexOf("/") + 1);
    const isTemporary = temporaryRequests.some((req) => req.id === requestId);

    if (isTemporary) {
      // Just remove from local state
      setTemporaryRequests((prev) => prev.filter((req) => req.id !== requestId));
    } else {
      // It's a fetched request, delete via API and refetch
      try {
        const deleteSuccess = await pylon.deleteOrderLink(actualId);
        if (deleteSuccess) {
          // Invalidate query cache to trigger refetch
          await queryClient.invalidateQueries({ queryKey: ["activeOrderLinks"] });
        } else {
          console.error("Failed to delete order link via API (returned false) for ID:", actualId);
          // TODO: Show error toast
        }
      } catch (error) {
        console.error("Error deleting order link:", error);
        // TODO: Show error toast
      }
    }
  };

  // --- Move requestColumns definition inside the component ---
  const requestColumns: Column<GetOrderLinksOutput>[] = [
    {
      name: "EXPIRES",
      uid: "expiresAt",
      align: "start",
      render: (order) => (
        <div className="truncate block w-[100px]">
          <Countdown expiresAt={order.expiresAt} />
        </div>
      ),
    },
    {
      name: "EMAIL",
      uid: "customer",
      align: "start",
      render: (order) => {
        const detail = order.customer?.email || formatPhoneNumber(order.customer?.phone) || "N/A";
        return <span className="truncate block text-sm max-w-[150px] sm:max-w-[200px]">{detail}</span>;
      },
    },
    {
      name: "AMOUNT",
      uid: "order.subtotal",
      align: "start",
      render: (order) => (
        <span className="truncate block text-sm font-medium">
          {formatAmountUSD(order.order.subtotal / 100)} {order.order.currency}
        </span>
      ),
    },
    {
      name: "PAYMENT LINK",
      uid: "link",
      align: "start",
      render: (order) => (
        <Snippet
          hideSymbol
          codeString={order.id}
          classNames={{
            base: "bg-default-100 dark:bg-default-200/50 p-1 rounded-md max-w-[150px] sm:max-w-[200px]",
            pre: "text-xs truncate font-mono text-foreground/70",
            copyButton: "text-foreground/50 hover:text-foreground/80",
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
      uid: "actions",
      align: "end",
      // Hide on mobile (screens smaller than sm breakpoint)
      render: (order) => (
        <div className="hidden sm:flex justify-end">
          <Trash2 className="w-4 h-4 text-danger hover:cursor-pointer" onClick={() => handleDeleteRequest(order.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6 px-2 sm:px-0">
      <DataTable
        title="Payment Activity"
        subtitle="View your processed payments and active payment requests"
        actionButton={
          <Button
            color="primary"
            variant="solid"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => setIsCreateModalOpen(true)}
          >
            Create Payment Request
          </Button>
        }
        aria-label="Payment History Table"
        columns={paymentHistoryColumns}
        items={transactions}
        isLoading={isLoadingHistory}
        isError={!!errorHistory}
        errorMessage={errorHistory ? String(errorHistory) : "Failed to load payment history"}
        emptyContent={<EmptyContent message="No payment activity found." />}
        isStriped={true}
        cardClassName="shadow-sm border border-default overflow-hidden"
        onRowAction={handleViewDetails}
      />

      {/* --- Active Requests Table (Use combined data) --- */}
      {/* Condition to show: check combined list or loading/error states */}
      {(activeRequests.length > 0 || isLoadingLinks) && (
        <DataTable
          title="Active Payment Requests"
          aria-label="Active Payment Requests Table"
          columns={requestColumns}
          items={activeRequests} // Use the combined and filtered list
          isLoading={isLoadingLinks} // Show loading state from query
          isError={!!errorLinks} // Show error state from query
          errorMessage={errorLinks ? String(errorLinks.message) : "Failed to load active requests"}
          // Show empty state only if not loading and list is empty
          emptyContent={
            !isLoadingLinks && activeRequests.length === 0 ? (
              <EmptyContent message="No active payment requests found." />
            ) : null
          }
          cardClassName="shadow-sm border border-default overflow-hidden"
          classNames={{
            th: "bg-transparent text-primary/80 font-normal uppercase text-xs h-8",
            table: "min-w-full",
            tr: "hover:bg-default-100 dark:hover:bg-default-200/50 transition-colors",
          }}
        />
      )}

      {/* Modals */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleOrderCreated}
      />

      {/* --- Payment Details Modal --- */}
      {selectedPayment && (
        <PaymentDetails
          isOpen={!!selectedPayment}
          response={{
            transactionId: selectedPayment.id,
            transactionStatus:
              selectedPayment.transactionStatusHistory[selectedPayment.transactionStatusHistory.length - 1]?.status ||
              "UNKNOWN", // Handle empty history
            transactionProcessor: selectedPayment.processor,
            transactionPaymentMethod: selectedPayment.paymentMethod,
            transactionSubtotal: centsToDollars(selectedPayment.subtotal),
            transactionTip: centsToDollars(selectedPayment.tipAmount),
            transactionCurrency: selectedPayment.currency,
            transactionTotal: centsToDollars(selectedPayment.total),
            // Safely access nested properties
            transactionBillingAddress: selectedPayment.billingAddress || {},
            transactionShippingAddress: selectedPayment.shippingAddress || {},
            transactionCreatedAt: selectedPayment.createdAt,
            timestamp: selectedPayment.createdAt,
          }}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

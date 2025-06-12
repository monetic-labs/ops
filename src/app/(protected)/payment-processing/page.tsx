"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { PlusIcon, Copy, Trash2, QrCode } from "lucide-react";
import { Snippet } from "@heroui/snippet";
import {
  PaymentListItem,
  GetPaymentLinkDetailsOutput,
  BillingAddress,
  CreatePaymentLinkOutput,
} from "@monetic-labs/sdk";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { paymentsStatusColorMap } from "@/data";
import {
  formatAmountUSD,
  formatStringToTitleCase,
  getTimeAgo,
  formatPhoneNumber,
  mapCurrencyToSymbol,
  getFullName,
  formatUsername,
} from "@/utils/helpers";
import Countdown from "@/components/generics/countdown";
import CreatePaymentRequestModal from "./_components/CreatePaymentRequestModal";
import { useOrderManagement } from "./_hooks/useOrderManagement";
import pylon from "@/libs/monetic-sdk";

// Import Detail Modals
import { PaymentDetails } from "./_components/order-details";
import { QRCodeModal } from "./_components/QRCodeModal";

const paymentHistoryColumns: Column<PaymentListItem>[] = [
  {
    name: "PAYMENT ID",
    uid: "id",
    render: (payment: PaymentListItem) => {
      const truncatedId = payment.id.length > 8 ? payment.id.slice(0, 8) : payment.id;
      return <span className="truncate block text-sm font-medium">{truncatedId}</span>;
    },
  },
  {
    name: "STATUS",
    uid: "paymentType",
    render: (payment: PaymentListItem) => {
      const status = payment.paymentType;
      return (
        <Chip
          className="capitalize truncate"
          color={paymentsStatusColorMap[status] || "default"}
          size="sm"
          variant="flat"
        >
          {formatStringToTitleCase(status)}
        </Chip>
      );
    },
  },
  {
    name: "AMOUNT",
    uid: "totalAmount",
    allowsSorting: true,
    render: (payment: PaymentListItem) => (
      <span className="truncate block text-sm font-medium">{formatAmountUSD(Number(payment.totalAmount))}</span>
    ),
  },
  {
    name: "CUSTOMER",
    uid: "customerId",
    render: (payment: PaymentListItem) => {
      const customer = payment.customer;
      const userFullName = getFullName(customer.firstName || "", customer.lastName || "", "Unknown");
      return (
        <span className="truncate block text-sm max-w-[150px] sm:max-w-[200px]">
          {formatUsername(customer.username) || userFullName}
        </span>
      );
    },
  },
  {
    name: "DATE",
    uid: "createdAt",
    allowsSorting: true,
    render: (payment: PaymentListItem) => (
      <span className="truncate block text-sm">{getTimeAgo(payment.createdAt)}</span>
    ),
  },
];

// Type definition for the creation modal (can be expanded if needed)
type ModalType = "payment" | null;

export default function PaymentProcessingPage() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const queryClient = useQueryClient();

  // State for viewing payment details
  const [selectedPayment, setSelectedPayment] = useState<PaymentListItem | null>(null);
  // State for QR Code Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Fetch Payment History
  const { payments, isLoading: isLoadingHistory, error: errorHistory } = useOrderManagement();

  // --- Fetch Existing Active Order Links ---
  const {
    data: fetchedActiveLinks = [],
    isLoading: isLoadingLinks,
    error: errorLinks,
  } = useQuery<GetPaymentLinkDetailsOutput[], Error>({
    queryKey: ["activePaymentLinks"],
    queryFn: async () => {
      const links = await pylon.getPaymentLinks();
      // Filter potentially expired links fetched from API if API doesn't pre-filter
      const now = Date.now();
      return links.filter((link) => new Date(link.expiresAt).getTime() > now);
    },
  });

  // Sync active requests when payment history is updated
  useEffect(() => {
    // When a payment is processed, it might have been an active request.
    // Invalidate the active links query to refresh the list.
    queryClient.invalidateQueries({ queryKey: ["activePaymentLinks"] });
  }, [payments, queryClient]);

  // --- Combined list of active requests (API + optimistic) ---
  const activeRequests = useMemo(() => {
    const now = Date.now();
    // Filter out expired links from the fetched data
    return (fetchedActiveLinks || []).filter((link) => new Date(link.expiresAt).getTime() > now);
  }, [fetchedActiveLinks]);

  // Handler for successful request creation
  const handleOrderCreated = async (newOrder: CreatePaymentLinkOutput) => {
    // Optimistically update the cache with the new payment request
    queryClient.setQueryData<GetPaymentLinkDetailsOutput[]>(["activePaymentLinks"], (oldData = []) => [
      newOrder,
      ...oldData,
    ]);

    setActiveModal(null); // Close the modal
  };

  // --- Handlers for Payment History Details ---
  const handleViewDetails = (payment: PaymentListItem) => {
    setSelectedPayment(payment);
  };

  const handleCloseModal = () => {
    setSelectedPayment(null);
  };

  // --- Handler for Deleting Payment Requests (Updated) ---
  const handleDeleteRequest = async (requestId: string) => {
    // Optimistically update the cache by removing the payment request
    queryClient.setQueryData<GetPaymentLinkDetailsOutput[]>(["activePaymentLinks"], (oldData = []) =>
      oldData.filter((r) => r.id !== requestId)
    );

    try {
      await pylon.deletePaymentLink(requestId);
      toast.success("Payment request deleted.");
      // Invalidate to ensure consistency, though optimistic removal is usually enough
      queryClient.invalidateQueries({ queryKey: ["activePaymentLinks"] });
    } catch (error) {
      console.error("Failed to delete payment request:", error);
      toast.error("Failed to delete payment request.");
      // Revert optimistic update on failure
      queryClient.invalidateQueries({ queryKey: ["activePaymentLinks"] });
    }
  };

  // --- Handler for Showing QR Code ---
  const handleShowQrCode = (url: string) => {
    const id = url.substring(url.lastIndexOf("/") + 1);
    setQrCodeUrl(id);
    setIsQrModalOpen(true);
  };

  // --- Move requestColumns definition inside the component ---
  const requestColumns: Column<GetPaymentLinkDetailsOutput>[] = [
    {
      name: "ID",
      uid: "id",
      render: (order) => {
        const truncatedId = order.id.length > 8 ? order.id.slice(0, 8) : order.id;
        return <span className="truncate block text-sm font-medium">{truncatedId}</span>;
      },
    },
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
      name: "AMOUNT",
      uid: "order.subtotal",
      align: "start",
      render: (order) => (
        <span className="truncate block text-sm font-medium">{formatAmountUSD(order.order.subtotal)}</span>
      ),
    },
    {
      name: "EMAIL",
      uid: "customer",
      align: "start",
      render: (order) => {
        const detail = order.customer?.email || formatPhoneNumber(order.customer?.phone || "") || "N/A";
        return <span className="truncate block text-sm max-w-[150px] sm:max-w-[200px]">{detail}</span>;
      },
    },
    {
      name: "PAYMENT LINK",
      uid: "link",
      align: "start",
      render: (order) => (
        <Snippet
          hideSymbol
          codeString={order.link}
          classNames={{
            base: "bg-default-100 dark:bg-default-200/50 p-1 rounded-md max-w-[150px] sm:max-w-[200px]",
            pre: "text-xs truncate font-mono text-foreground/70",
            copyButton: "text-foreground/50 hover:text-foreground/80",
          }}
          size="sm"
          variant="flat"
        >
          {order.link}
        </Snippet>
      ),
    },
    {
      name: "ACTIONS",
      uid: "actions",
      align: "end",
      // Show actions on all screen sizes
      render: (order) => (
        <div className="flex justify-end items-center gap-3">
          <QrCode
            className="w-4 h-4 text-foreground/70 hover:text-foreground hover:cursor-pointer"
            onClick={() => handleShowQrCode(order.id)}
          />
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
            onPress={() => setActiveModal("payment")}
            className="w-full sm:w-auto" // Full width on mobile
          >
            Payment Request
          </Button>
        }
        aria-label="Payment History Table"
        columns={paymentHistoryColumns}
        items={payments}
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
      <CreatePaymentRequestModal
        isOpen={activeModal === "payment"}
        onClose={() => setActiveModal(null)}
        onCreate={handleOrderCreated}
      />

      {/* --- Payment Details Modal --- */}
      {selectedPayment && (
        <PaymentDetails
          isOpen={!!selectedPayment}
          response={{
            transactionId: selectedPayment.id,
            transactionStatus: selectedPayment.paymentType,
            transactionSubtotal: selectedPayment.subtotalAmount,
            transactionTip: selectedPayment.tipAmount,
            transactionCurrency: selectedPayment.currency,
            transactionTotal: selectedPayment.totalAmount,
            // Safely access nested properties
            transactionBillingAddress: selectedPayment.billingAddress,
            transactionShippingAddress: selectedPayment.shippingAddress,
            transactionCreatedAt: selectedPayment.createdAt,
            timestamp: selectedPayment.createdAt,
          }}
          onClose={handleCloseModal}
        />
      )}

      {/* QR Code Modal */}
      <QRCodeModal isOpen={isQrModalOpen} onOpenChange={setIsQrModalOpen} qrCodeUrl={qrCodeUrl} />
    </div>
  );
}

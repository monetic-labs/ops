import React, { useState, ReactNode, useCallback } from "react";
import { Chip } from "@nextui-org/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { Button } from "@nextui-org/button";
import { TransactionListItem } from "@backpack-fux/pylon-sdk";

import { useOrderManagement } from "@/hooks/orders/useOrderManagement";
import { centsToDollars, getTimeAgo, mapCurrencyToSymbol } from "@/utils/helpers";

import { DetailsResponse } from "./actions/order-details";
import { CancelConfirmationModal } from "./actions/order-cancel";
import { RefundModal } from "./actions/order-refund";

const columns = [
  { name: "ID", uid: "id" },
  { name: "Status", uid: "status" },
  { name: "Payment Method", uid: "paymentMethod" },
  { name: "Total", uid: "total" },
  { name: "Created", uid: "createdAt" },
  { name: "Actions", uid: "actions" },
];

const statusColorMap: Record<string, "success" | "warning" | "danger" | "primary" | "secondary"> = {
  SENT_FOR_AUTHORIZATION: "primary",
  AUTHORIZED: "secondary",
  SENT_FOR_SETTLEMENT: "warning",
  SETTLED: "success",
  SETTLEMENT_FAILED: "danger",
  CANCELLED: "danger",
  ERROR: "danger",
  EXPIRED: "danger",
  REFUSED: "danger",
  SENT_FOR_REFUND: "warning",
  REFUNDED: "success",
  REFUND_FAILED: "danger",
};

export default function PaymentsTab() {
  const { transactions, isLoading, error } = useOrderManagement();
  const [selectedPayment, setSelectedPayment] = useState<TransactionListItem | null>(null);
  const [cancelPayment, setCancelPayment] = useState<TransactionListItem | null>(null);
  const [refundPayment, setRefundPayment] = useState<TransactionListItem | null>(null);

  const handleViewDetails = (payment: TransactionListItem) => {
    setSelectedPayment(payment);
  };

  const handleCloseModal = () => {
    setSelectedPayment(null);
  };

  const handleCancelOrder = (payment: TransactionListItem) => {
    setCancelPayment(payment);
  };

  const handleConfirmCancel = () => {
    if (cancelPayment) {
      console.log("Order cancelled:", cancelPayment.id);
      // Implement cancel logic here
      setCancelPayment(null);
    }
  };

  const handleCloseCancelModal = () => {
    setCancelPayment(null);
  };

  const handleRefund = (payment: TransactionListItem) => {
    setRefundPayment(payment);
  };

  const handleConfirmRefund = (refundAmount: number) => {
    if (refundPayment) {
      console.log("Refund initiated for order:", refundPayment.id, "Amount:", refundAmount);
      // Implement refund logic here
      setRefundPayment(null);
    }
  };

  const handleCloseRefundModal = () => {
    setRefundPayment(null);
  };

  const renderCell = useCallback((transaction: TransactionListItem, columnKey: React.Key): ReactNode => {
    const cellValue = transaction[columnKey as keyof TransactionListItem];

    const statusLength = transaction.transactionStatusHistory.length;
    const lastStatus = transaction.transactionStatusHistory[statusLength - 1].status;
    const isSettled = lastStatus === "SETTLED";

    switch (columnKey) {
      case "status":
        return (
          <Chip className="capitalize" color={statusColorMap[lastStatus] || "default"} size="sm" variant="flat">
            {lastStatus}
          </Chip>
        );
      case "paymentMethod":
        return `${transaction.paymentMethod.charAt(0).toUpperCase()}${transaction.paymentMethod
          .slice(1)
          .toLowerCase()}`;
      case "total":
        return `${mapCurrencyToSymbol[transaction.currency.toLowerCase()]}${centsToDollars(transaction.total)}`;
      case "subtotal":
        return `${mapCurrencyToSymbol[transaction.currency.toLowerCase()]}${centsToDollars(transaction.subtotal)}`;
      case "tipAmount":
        return `${mapCurrencyToSymbol[transaction.currency.toLowerCase()]}${centsToDollars(transaction.tipAmount)}`;
      case "createdAt":
        return getTimeAgo(transaction.createdAt);
      case "actions":
        const isRefundDisabled = process.env.NODE_ENV === "development" ? false : !isSettled;
        const isCancelDisabled = true;

        return (
          <span className="flex gap-2">
            <Button
              isDisabled={isCancelDisabled}
              size="sm"
              onPress={() => {
                if (!isCancelDisabled) handleCancelOrder(transaction);
              }}
            >
              Cancel
            </Button>
            <Button
              isDisabled={isRefundDisabled}
              size="sm"
              onPress={() => {
                if (!isRefundDisabled) handleRefund(transaction);
              }}
            >
              Refund
            </Button>
          </span>
        );
      default:
        return cellValue !== null && cellValue !== undefined ? String(cellValue) : "";
    }
  }, []);

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Table aria-label="Transactions table with custom cells">
        <TableHeader columns={columns}>
          {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
        </TableHeader>
        <TableBody emptyContent={isLoading ? null : "No transactions found"} items={transactions}>
          {(item) => {
            return (
              <TableRow
                key={item.id}
                className="cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-charyo-500"
                onClick={(e) => {
                  const target = e.target as HTMLElement;

                  if (!target.closest("button") && !target.closest(".flex.gap-2")) {
                    handleViewDetails(item);
                  }
                }}
              >
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
      {selectedPayment && (
        <DetailsResponse
          isOpen={!!selectedPayment}
          response={{
            transactionId: selectedPayment.id,
            transactionStatus:
              selectedPayment.transactionStatusHistory[selectedPayment.transactionStatusHistory.length - 1].status,
            transactionProcessor: selectedPayment.processor,
            transactionPaymentMethod: selectedPayment.paymentMethod,
            transactionSubtotal: centsToDollars(selectedPayment.subtotal),
            transactionTip: centsToDollars(selectedPayment.tipAmount),
            transactionCurrency: selectedPayment.currency,
            transactionTotal: centsToDollars(selectedPayment.total),
            transactionBillingAddress: selectedPayment.billingAddress,
            transactionShippingAddress: selectedPayment.shippingAddress,
            transactionCreatedAt: selectedPayment.createdAt,
            timestamp: selectedPayment.createdAt,
            // TODO: add risk score
          }}
          onClose={handleCloseModal}
        />
      )}
      {cancelPayment && (
        <CancelConfirmationModal
          isOpen={!!cancelPayment}
          order={{
            orderId: cancelPayment.id,
            customerName: `${cancelPayment.billingAddress.firstName} ${cancelPayment.billingAddress.lastName}`,
            amount: `${mapCurrencyToSymbol[cancelPayment.currency.toLowerCase()]}${cancelPayment.total / 100}`,
          }}
          onClose={handleCloseCancelModal}
          onConfirm={handleConfirmCancel}
        />
      )}
      {refundPayment && (
        <RefundModal
          isOpen={!!refundPayment}
          order={{
            orderId: refundPayment.id,
            processor: refundPayment.processor,
            networkStatus:
              refundPayment.transactionStatusHistory[refundPayment.transactionStatusHistory.length - 1].status,
            customerName: `${refundPayment.billingAddress.firstName} ${refundPayment.billingAddress.lastName}`,
            orderAmount: parseFloat(centsToDollars(refundPayment.subtotal)),
            totalAmount: parseFloat(centsToDollars(refundPayment.total)),
          }}
          onClose={handleCloseRefundModal}
          onConfirm={handleConfirmRefund}
        />
      )}
    </>
  );
}

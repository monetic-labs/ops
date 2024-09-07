import React, { useState, useMemo, ReactNode, useCallback } from "react";
import { Chip } from "@nextui-org/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { Button } from "@nextui-org/button";
import { TransactionListItem } from "@backpack-fux/pylon-sdk";

import { NetworkResponse } from "./actions/network-response";
import { CancelConfirmationModal } from "./actions/order-cancel";
import { RefundModal } from "./actions/order-refund";
import { useOrderManagement } from "@/hooks/orders/useOrderManagement";
import { centsToDollars, formattedDate, getTimeAgo, mapCurrencyToSymbol } from "@/utils/helpers";

const columns = [
  { name: "ID", uid: "id" },
  { name: "Status", uid: "status" },
  { name: "Payment Method", uid: "paymentMethod" },
  { name: "Total", uid: "total" },
  { name: "Created", uid: "createdAt" },
  { name: "Actions", uid: "actions" },
];

const statusColorMap: Record<string, "success" | "warning" | "danger"> = {
  COMPLETE: "success",
  PENDING: "warning",
  FAILED: "danger",
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

    switch (columnKey) {
      case "id":
        return transaction.id.split("-")[transaction.id.split("-").length - 1];
      case "status":
        return (
          <Chip className="capitalize" color={statusColorMap[transaction.status] || "default"} size="sm" variant="flat">
            {transaction.status}
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
        return (
          <div className="flex gap-2">
            <Button size="sm" onPress={() => handleViewDetails(transaction)}>
              Details
            </Button>
            <Button size="sm" onPress={() => handleCancelOrder(transaction)}>
              Cancel
            </Button>
            <Button size="sm" onPress={() => handleRefund(transaction)}>
              Refund
            </Button>
          </div>
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
          {(column) => (
            <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={transactions}>
          {(item) => (
            <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>
          )}
        </TableBody>
      </Table>
      {selectedPayment && (
        <NetworkResponse
          isOpen={!!selectedPayment}
          response={{
            transactionId: selectedPayment.id,
            transactionStatus: selectedPayment.status,
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
            networkStatus: refundPayment.status,
            customerName: `${refundPayment.billingAddress.firstName} ${refundPayment.billingAddress.lastName}`,
            orderAmount: refundPayment.subtotal,
            totalAmount: refundPayment.total,
          }}
          onClose={handleCloseRefundModal}
          onConfirm={handleConfirmRefund}
        />
      )}
    </>
  );
}

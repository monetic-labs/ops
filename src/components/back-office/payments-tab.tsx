import React, { useState, ReactNode, useCallback } from "react";
import { Chip } from "@nextui-org/chip";
import { TransactionListItem } from "@backpack-fux/pylon-sdk";
import pylon from "@/libs/pylon-sdk";

import { useOrderManagement } from "@/hooks/orders/useOrderManagement";
import { centsToDollars, getTimeAgo, mapCurrencyToSymbol } from "@/utils/helpers";

import { PaymentDetails } from "./actions/order-details";
import { CancelConfirmationModal } from "./actions/order-cancel";
import { RefundModal } from "./actions/order-refund";
import { RefundSuccessModal } from "./actions/order-success";

import { Column, paymentsColumns, paymentsStatusColorMap } from "@/data";
import InfiniteTable from "../generics/table-infinite";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";

export default function PaymentsTab() {
  const { transactions, isLoading, error } = useOrderManagement();
  const [selectedPayment, setSelectedPayment] = useState<TransactionListItem | null>(null);
  const [cancelPayment, setCancelPayment] = useState<TransactionListItem | null>(null);
  const [refundPayment, setRefundPayment] = useState<TransactionListItem | null>(null);
  const [showRefundSuccessModal, setShowRefundSuccessModal] = useState(false);
  const [refundReference, setRefundReference] = useState("");

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

  const handleConfirmRefund = async (refundAmount: number) => {
    if (refundPayment) {
      try {
        const refundResponse = await pylon.processRefund({
          transactionId: refundPayment.id,
          amount: refundAmount,
          currency: refundPayment.currency,
          ...(refundReference && { reference: refundReference }),
        });
        if (refundResponse.statusCode === 200 && refundResponse.data.success) {
          console.log("Refund request successful for transaction:", refundPayment.id);
          setShowRefundSuccessModal(true);
        } else {
          throw new Error("Refund request failed");
        }
      } catch (error) {
        console.error("Error processing refund:", error);
      } finally {
        setRefundPayment(null);
      }
    }
  };

  const handleCloseRefundModal = () => {
    setRefundPayment(null);
  };

  const renderCell = useCallback(
    (transaction: TransactionListItem, columnKey: keyof TransactionListItem): React.ReactNode => {
      const cellValue = transaction[columnKey];

      const statusLength = transaction.transactionStatusHistory.length;
      const lastStatus = transaction.transactionStatusHistory[statusLength - 1].status;
      const isSettled = lastStatus === "SETTLED";
      const isRefunded = lastStatus === "SENT_FOR_REFUND" || lastStatus === "REFUNDED";
      const isRefundDisabled = !isSettled || isRefunded;
      const isCancelDisabled = true;

      switch (columnKey) {
        case "transactionStatusHistory":
          return (
            <Chip
              className="capitalize"
              color={paymentsStatusColorMap[lastStatus] || "default"}
              size="sm"
              variant="flat"
            >
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
        default:
          return cellValue !== null && cellValue !== undefined ? String(cellValue) : "";
      }
    },
    []
  );

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Table aria-label="Transactions table with custom cells">
        <TableHeader columns={paymentsColumns as Column<TransactionListItem>[]}>
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
                {(columnKey) => <TableCell>{renderCell(item, columnKey as keyof TransactionListItem)}</TableCell>}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
      {selectedPayment && (
        <PaymentDetails
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
          setRefundReference={setRefundReference}
          refundReference={refundReference}
          onClose={handleCloseRefundModal}
          onConfirm={handleConfirmRefund}
        />
      )}
      {showRefundSuccessModal && (
        <RefundSuccessModal
          isOpen={showRefundSuccessModal}
          title="Refund Successful"
          message="The refund has been processed successfully."
          onClose={() => setShowRefundSuccessModal(false)}
          fadeOutOpts={{ autoFadeOut: false }}
        />
      )}
    </>
  );
}

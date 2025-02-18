import React, { useState } from "react";
import { Chip } from "@nextui-org/chip";
import { TransactionListItem } from "@backpack-fux/pylon-sdk";

import { DataTable, EmptyContent, Column } from "@/components/generics/data-table";
import pylon from "@/libs/pylon-sdk";
import { useOrderManagement } from "@/hooks/orders/useOrderManagement";
import { capitalizeFirstChar, centsToDollars, formatStringToTitleCase, getTimeAgo, mapCurrencyToSymbol } from "@/utils/helpers";
import { paymentsStatusColorMap } from "@/data";

import { PaymentDetails } from "./actions/order-details";
import { CancelConfirmationModal } from "./actions/order-cancel";
import { RefundModal } from "./actions/order-refund";
import { RefundSuccessModal } from "./actions/order-success";

const paymentColumns: Column<TransactionListItem>[] = [
  {
    name: "STATUS",
    uid: "transactionStatusHistory",
    render: (payment: TransactionListItem) => {
      const statusLength = payment.transactionStatusHistory.length;
      const lastStatus = payment.transactionStatusHistory[statusLength - 1].status;

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
    name: "PAYMENT METHOD",
    uid: "paymentMethod",
    render: (payment: TransactionListItem) => (
      <span className="truncate block max-w-[150px] sm:max-w-[200px]">
        {formatStringToTitleCase(payment.paymentMethod)}
      </span>
    ),
  },
  {
    name: "TOTAL",
    uid: "total",
    render: (payment: TransactionListItem) => (
      <span className="truncate block">
        {mapCurrencyToSymbol[payment.currency.toLowerCase()]}${centsToDollars(payment.total)}
      </span>
    ),
  },
  {
    name: "SUBTOTAL",
    uid: "subtotal",
    render: (payment: TransactionListItem) => (
      <span className="truncate block">
        {mapCurrencyToSymbol[payment.currency.toLowerCase()]}${centsToDollars(payment.subtotal)}
      </span>
    ),
  },
  {
    name: "TIP",
    uid: "tipAmount",
    render: (payment: TransactionListItem) => (
      <span className="truncate block">
        {mapCurrencyToSymbol[payment.currency.toLowerCase()]}${centsToDollars(payment.tipAmount)}
      </span>
    ),
  },
  {
    name: "CREATED",
    uid: "createdAt",
    render: (payment: TransactionListItem) => <span className="truncate block">{getTimeAgo(payment.createdAt)}</span>,
  },
];

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

  return (
    <>
      <DataTable
        aria-label="Payments table"
        columns={paymentColumns}
        emptyContent={<EmptyContent message="No payments found" />}
        errorMessage="Failed to load payments"
        isError={!!error}
        isLoading={isLoading}
        items={transactions}
        onRowAction={handleViewDetails}
      />

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
          refundReference={refundReference}
          setRefundReference={setRefundReference}
          onClose={handleCloseRefundModal}
          onConfirm={handleConfirmRefund}
        />
      )}

      {showRefundSuccessModal && (
        <RefundSuccessModal
          fadeOutOpts={{ autoFadeOut: false }}
          isOpen={showRefundSuccessModal}
          message="The refund has been processed successfully."
          title="Refund Successful"
          onClose={() => setShowRefundSuccessModal(false)}
        />
      )}
    </>
  );
}

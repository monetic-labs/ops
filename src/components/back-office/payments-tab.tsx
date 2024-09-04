import React, { useState } from "react";
import { Chip } from "@nextui-org/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { Tooltip } from "@nextui-org/tooltip";
import { User } from "@nextui-org/user";
import { Button } from "@nextui-org/button";

import { NetworkResponse } from "./actions/network-response";
import { CancelConfirmationModal } from "./actions/order-cancel";
import { RefundModal } from "./actions/order-refund";

const columns = [
  { name: "CUSTOMER", uid: "customer" },
  { name: "PAYMENT STATUS", uid: "paymentStatus" },
  { name: "ORDER ID", uid: "orderId" },
  { name: "TOTAL", uid: "total" },
  { name: "ACTIONS", uid: "actions" },
];

const payments = [
  {
    customer: "John Doe",
    paymentStatus: "Paid",
    orderId: "ORD-001",
    total: "$100.00",
  },
  {
    customer: "Jane Smith",
    paymentStatus: "Pending",
    orderId: "ORD-002",
    total: "$75.50",
  },
  {
    customer: "Bob Johnson",
    paymentStatus: "Failed",
    orderId: "ORD-003",
    total: "$150.00",
  },
];

const statusColorMap: Record<string, "success" | "warning" | "danger"> = {
  Paid: "success",
  Pending: "warning",
  Failed: "danger",
};

export default function PaymentsTab() {
  const [selectedPayment, setSelectedPayment] = useState<(typeof payments)[0] | null>(null);
  const [cancelPayment, setCancelPayment] = useState<(typeof payments)[0] | null>(null);
  const [refundPayment, setRefundPayment] = useState<(typeof payments)[0] | null>(null);

  const handleViewDetails = (payment: (typeof payments)[0]) => {
    setSelectedPayment(payment);
  };

  const handleCloseModal = () => {
    setSelectedPayment(null);
  };

  const handleCancelOrder = (payment: (typeof payments)[0]) => {
    setCancelPayment(payment);
  };

  const handleConfirmCancel = () => {
    if (cancelPayment) {
      console.log("Order cancelled:", cancelPayment.orderId);
      // Implement cancel logic here
      setCancelPayment(null);
    }
  };

  const handleCloseCancelModal = () => {
    setCancelPayment(null);
  };

  const handleRefund = (payment: (typeof payments)[0]) => {
    setRefundPayment(payment);
  };

  const handleConfirmRefund = (refundAmount: number) => {
    if (refundPayment) {
      console.log("Refund initiated for order:", refundPayment.orderId, "Amount:", refundAmount);
      // Implement refund logic here
      setRefundPayment(null);
    }
  };

  const handleCloseRefundModal = () => {
    setRefundPayment(null);
  };

  const handleResendReceipt = (payment: (typeof payments)[0]) => {
    console.log("Resending receipt for order:", payment.orderId);
    // Implement resend receipt logic here
  };

  const renderCell = React.useCallback((payment: (typeof payments)[0], columnKey: React.Key) => {
    const cellValue = payment[columnKey as keyof (typeof payments)[0]];

    switch (columnKey) {
      case "customer":
        return (
          <User
            avatarProps={{
              radius: "lg",
              src: `https://i.pravatar.cc/150?u=${payment.orderId}`,
            }}
            description={payment.orderId}
            name={cellValue}
          >
            {payment.customer}
          </User>
        );
      case "paymentStatus":
        return (
          <Chip className="capitalize" color={statusColorMap[payment.paymentStatus]} size="sm" variant="flat">
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex items-center justify-center gap-2">
            <Tooltip content="View Payment Details">
              <Button 
                className="text-notpurple-500" 
                size="sm" 
                onPress={() => handleViewDetails(payment)}>
                Details
              </Button>
            </Tooltip>
            <Tooltip content="Cancel Order">
              <Button
                className="text-notpurple-500"
                size="sm"
                onPress={() => handleCancelOrder(payment)}
              >
                Cancel
              </Button>
            </Tooltip>
            <Tooltip content="Refund Order">
              <Button
                className="text-notpurple-500"
                size="sm"
                onPress={() => handleRefund(payment)}
              >
                Refund
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  return (
    <>
      <Table
        aria-label="Payments table with custom cells"
        classNames={{
          wrapper: "text-notpurple-500",
          th: "text-notpurple-500",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={payments}>
          {(item) => (
            <TableRow key={item.orderId}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey as keyof (typeof payments)[0])}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {selectedPayment && (
        <NetworkResponse
          isOpen={!!selectedPayment}
          response={{
            transactionId: selectedPayment.orderId,
            responseStatus: selectedPayment.paymentStatus,
            responseCode: "00", // You'll need to add this to your payment data
            riskScore: 30, // You'll need to add this to your payment data
            timestamp: new Date().toISOString(), // You'll need to add this to your payment data
          }}
          onClose={handleCloseModal}
        />
      )}
      {cancelPayment && (
        <CancelConfirmationModal
          isOpen={!!cancelPayment}
          order={{
            orderId: cancelPayment.orderId,
            customerName: cancelPayment.customer,
            customerEmail: "customer@example.com", // You'll need to add this to your payment data
            amount: cancelPayment.total,
          }}
          onClose={handleCloseCancelModal}
          onConfirm={handleConfirmCancel}
        />
      )}
      {refundPayment && (
        <RefundModal
          isOpen={!!refundPayment}
          order={{
            orderId: refundPayment.orderId,
            worldpayId: "WP" + refundPayment.orderId, // You'll need to add this to your payment data
            networkStatus: refundPayment.paymentStatus,
            customerName: refundPayment.customer,
            customerEmail: "customer@example.com", // You'll need to add this to your payment data
            customerPhone: "123-456-7890", // You'll need to add this to your payment data
            cardLastFour: "1234", // You'll need to add this to your payment data
            issuingBank: "Example Bank", // You'll need to add this to your payment data
            bin: "123456", // You'll need to add this to your payment data
            orderAmount: parseFloat(refundPayment.total.replace("$", "")),
            totalAmount: parseFloat(refundPayment.total.replace("$", "")),
          }}
          onClose={handleCloseRefundModal}
          onConfirm={handleConfirmRefund}
        />
      )}
    </>
  );
}

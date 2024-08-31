import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Input } from "@nextui-org/input";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (refundAmount: number) => void;
  order: {
    orderId: string;
    worldpayId: string;
    networkStatus: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    cardLastFour: string;
    issuingBank: string;
    bin: string;
    orderAmount: number;
    totalAmount: number;
  };
}

export function RefundModal({
  isOpen,
  onClose,
  onConfirm,
  order,
}: RefundModalProps) {
  const [refundAmount, setRefundAmount] = useState(order.totalAmount);

  const handleRefundAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value <= order.totalAmount) {
      setRefundAmount(value);
    }
  };

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Refund Order</h2>
              <p className="text-sm text-gray-500">
                Order ID: {order.orderId}
              </p>
            </ModalHeader>
            <Divider />
            <ModalBody>
              <div className="space-y-4 font-mono">
                <div className="flex justify-between">
                  <span>Worldpay ID:</span>
                  <span>{order.worldpayId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Status:</span>
                  <span>{order.networkStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Name:</span>
                  <span>{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Email:</span>
                  <span>{order.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Phone:</span>
                  <span>{order.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Last 4 Digits:</span>
                  <span>{order.cardLastFour}</span>
                </div>
                <div className="flex justify-between">
                  <span>Issuing Bank:</span>
                  <span>{order.issuingBank}</span>
                </div>
                <div className="flex justify-between">
                  <span>BIN:</span>
                  <span>{order.bin}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Amount:</span>
                  <span>${order.orderAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                <Divider />
                <div className="flex flex-col">
                  <label htmlFor="refundAmount" className="mb-2">Refund Amount:</label>
                  <Input
                    id="refundAmount"
                    type="number"
                    value={refundAmount.toString()}
                    onChange={handleRefundAmountChange}
                    min={0}
                    max={order.totalAmount}
                    step={0.01}
                  />
                </div>
              </div>
            </ModalBody>
            <Divider />
            <ModalFooter className="flex justify-center space-x-4">
              <Button color="primary" onPress={() => onConfirm(refundAmount)}>
                Confirm Refund
              </Button>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
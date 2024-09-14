import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Input } from "@nextui-org/input";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (refundAmount: number) => void;
  order: {
    orderId: string;
    processor: string;
    networkStatus: string;
    customerName: string;
    orderAmount: number;
    totalAmount: number;
  };
  setRefundReference: (refundReference: string) => void;
  refundReference: string;
}

export function RefundModal({
  isOpen,
  onClose,
  onConfirm,
  order,
  refundReference,
  setRefundReference,
}: RefundModalProps) {
  const [refundAmount, setRefundAmount] = useState(order.totalAmount);
  const [isPartialRefund, setIsPartialRefund] = useState(false);
  const [isReferenceValid, setIsReferenceValid] = useState(true);

  useEffect(() => {
    setIsPartialRefund(refundAmount < order.totalAmount);
  }, [refundAmount, order.totalAmount]);

  const handleRefundAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value <= order.totalAmount) {
      setRefundAmount(value);
    }
  };

  const handleRefundReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (validateReference(newValue)) {
      setRefundReference(newValue);
      setIsReferenceValid(true);
    } else {
      setIsReferenceValid(false);
    }
  };

  const validateReference = (value: string) => {
    const regex = /^[a-zA-Z0-9-]*$/;
    return regex.test(value);
  };

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Refund Order</h2>
              <p className="text-sm text-gray-500">Order ID: {order.orderId}</p>
            </ModalHeader>
            <Divider />
            <ModalBody>
              <div className="space-y-4 font-mono">
                <div className="flex justify-between">
                  <span>Network Status:</span>
                  <span>{order.networkStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Name:</span>
                  <span>{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Amount:</span>
                  <span>${order.orderAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>${order.totalAmount}</span>
                </div>
                <Divider />
                <div className="flex flex-col">
                  <label className="mb-2" htmlFor="refundAmount">
                    Refund Amount:
                  </label>
                  <Input
                    id="refundAmount"
                    max={order.totalAmount}
                    min={0.01}
                    step={0.01}
                    type="number"
                    value={refundAmount.toString()}
                    onChange={handleRefundAmountChange}
                  />
                </div>
                {isPartialRefund && (
                  <div className="flex flex-col">
                    <label className="mb-2" htmlFor="refundReference">
                      Refund Reference:
                    </label>
                    <Input
                      id="refundReference"
                      type="text"
                      value={refundReference}
                      onChange={handleRefundReferenceChange}
                      placeholder="Enter refund reference"
                      isInvalid={!isReferenceValid}
                      errorMessage={
                        !isReferenceValid ? "Reference can contain only alphanumeric characters and hyphens" : ""
                      }
                    />
                  </div>
                )}
              </div>
            </ModalBody>
            <Divider />
            <ModalFooter className="flex justify-center space-x-4">
              <Button
                color="primary"
                onPress={() => onConfirm(refundAmount)}
                isDisabled={isPartialRefund && (!isReferenceValid || refundReference.length === 0)}
              >
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

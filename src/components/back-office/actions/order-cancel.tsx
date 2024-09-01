import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";

interface CancelConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    amount: string;
  };
}

export function CancelConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  order,
}: CancelConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} size="md" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Cancel Order Confirmation</h2>
              <p className="text-sm text-gray-500">Order ID: {order.orderId}</p>
            </ModalHeader>
            <Divider />
            <ModalBody>
              <div className="space-y-4 font-mono">
                <div className="flex justify-between">
                  <span>Customer Name:</span>
                  <span>{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Email:</span>
                  <span>{order.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Amount:</span>
                  <span>{order.amount}</span>
                </div>
              </div>
              <p className="mt-4 text-center text-red-500">
                Are you sure you want to cancel this order?
              </p>
            </ModalBody>
            <Divider />
            <ModalFooter className="flex justify-center space-x-4">
              <Button
                className="bg-ualert-500 text-notpurple-500"
                onPress={onClose}
              >
                Go Back
              </Button>
              <Button
                className="bg-ualert-500 text-notpurple-500"
                onPress={onConfirm}
              >
                Confirm Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { BillingAddress, ShippingAddress } from "@backpack-fux/pylon-sdk";
import { formattedDate, mapCurrencyToSymbol } from "@/utils/helpers";

interface NetworkResponseProps {
  isOpen: boolean;
  onClose: () => void;
  response: {
    transactionId: string;
    transactionStatus: string;
    transactionProcessor: string;
    transactionPaymentMethod: string;
    transactionSubtotal: string;
    transactionTip: string;
    transactionTotal: string;
    transactionCurrency: string;
    transactionBillingAddress: BillingAddress;
    transactionShippingAddress: ShippingAddress;
    transactionCreatedAt: string;
    timestamp: string;
  };
}

export function NetworkResponse({ isOpen, onClose, response }: NetworkResponseProps) {
  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose} className="">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Network Response</h2>
              <p className="text-sm text-gray-500">Transaction ID: {response.transactionId}</p>
            </ModalHeader>
            <Divider />
            <ModalBody>
              <div className="space-y-4 font-mono">
                <div className="flex justify-between">
                  <span>Response Status:</span>
                  <span
                    className={`font-bold ${
                      response.transactionStatus === "Approved"
                        ? "text-ualert-100"
                        : response.transactionStatus === "Failed"
                        ? "text-ualert-300"
                        : "text-ualert-500"
                    }`}
                  >
                    {response.transactionStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Processor:</span>
                  <span>{response.transactionProcessor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{response.transactionPaymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{`${mapCurrencyToSymbol[response.transactionCurrency.toLowerCase()]}${
                    response.transactionSubtotal
                  } ${response.transactionCurrency}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tip:</span>
                  <span>{`${mapCurrencyToSymbol[response.transactionCurrency.toLowerCase()]}${
                    response.transactionTip
                  } ${response.transactionCurrency}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{`${mapCurrencyToSymbol[response.transactionCurrency.toLowerCase()]}${
                    response.transactionTotal
                  } ${response.transactionCurrency}`}</span>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <span>Billing Address:</span>
                  <span>{response.transactionBillingAddress.firstName}</span>
                  <span>{response.transactionBillingAddress.lastName}</span>
                  <span>{response.transactionBillingAddress.street1}</span>
                  <span>{response.transactionBillingAddress.street2}</span>
                  <span>{response.transactionBillingAddress.street3}</span>
                  <span>{response.transactionBillingAddress.city}</span>
                  <span>{response.transactionBillingAddress.state}</span>
                  <span>{response.transactionBillingAddress.postcode}</span>
                  <span>{response.transactionBillingAddress.state}</span>
                  <span>{response.transactionBillingAddress.country}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Address:</span>
                  <span>{response.transactionShippingAddress.firstName}</span>
                  <span>{response.transactionShippingAddress.lastName}</span>
                  <span>{response.transactionShippingAddress.street1}</span>
                  <span>{response.transactionShippingAddress.street2}</span>
                  <span>{response.transactionShippingAddress.street3}</span>
                  <span>{response.transactionShippingAddress.city}</span>
                  <span>{response.transactionShippingAddress.state}</span>
                  <span>{response.transactionShippingAddress.postcode}</span>
                  <span>{response.transactionShippingAddress.country}</span>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span>{formattedDate(response.timestamp)}</span>
                </div>
              </div>
            </ModalBody>
            <Divider />
            <ModalFooter className="flex justify-center">
              <Button className="bg-ualert-500 text-notpurple-500" color="primary" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

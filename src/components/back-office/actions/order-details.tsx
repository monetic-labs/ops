import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";
import { Divider } from "@nextui-org/divider";
import { BillingAddress, ShippingAddress } from "@backpack-fux/pylon-sdk";

import { formattedDate, mapCurrencyToSymbol } from "@/utils/helpers";
import ModalFooterWithSupport from "@/components/generics/footer-modal-support";

interface PaymentDetailsResponseProps {
  isOpen: boolean;
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
  onClose: () => void;
}

export function PaymentDetails({ isOpen, response, onClose }: PaymentDetailsResponseProps) {

  const handleSupportClick = () => {
    // Handle support action
    console.log("Support clicked");
  };
  return (
    <Modal
      className="max-w-md mx-auto"
      isOpen={isOpen}
      onClose={onClose}
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Details Response</h2>
              <p className="text-sm text-gray-500">Transaction ID: {response.transactionId}</p>
            </ModalHeader>
            <Divider />
            <ModalBody>
              <div className="space-y-4 font-mono text-sm">
                {/* Transaction details */}
                <div className="grid grid-cols-2 gap-2">
                  <span>Response Status:</span>
                  <span className={`text-right font-bold ${
                    response.transactionStatus === "Approved"
                      ? "text-ualert-100"
                      : response.transactionStatus === "Failed"
                        ? "text-ualert-300"
                        : "text-ualert-500"
                  }`}>
                    {response.transactionStatus}
                  </span>
                  <span>Processor:</span>
                  <span className="text-right">{response.transactionProcessor}</span>
                  <span>Payment Method:</span>
                  <span className="text-right">{response.transactionPaymentMethod}</span>
                  <span>Subtotal:</span>
                  <span className="text-right">{`${mapCurrencyToSymbol[response.transactionCurrency.toLowerCase()]}${
                    response.transactionSubtotal
                  } ${response.transactionCurrency}`}</span>
                  <span>Tip:</span>
                  <span className="text-right">{`${mapCurrencyToSymbol[response.transactionCurrency.toLowerCase()]}${
                    response.transactionTip
                  } ${response.transactionCurrency}`}</span>
                  <span>Total:</span>
                  <span className="text-right">{`${mapCurrencyToSymbol[response.transactionCurrency.toLowerCase()]}${
                    response.transactionTotal
                  } ${response.transactionCurrency}`}</span>
                </div>
                <Divider />
                {/* Billing Address */}
                <div>
                  <span className="font-bold mb-1">Billing Address:</span>
                  <address className="not-italic text-right">
                    {response.transactionBillingAddress.firstName} {response.transactionBillingAddress.lastName}<br />
                    {response.transactionBillingAddress.street1}<br />
                    {response.transactionBillingAddress.street2 && <>{response.transactionBillingAddress.street2}<br /></>}
                    {response.transactionBillingAddress.street3 && <>{response.transactionBillingAddress.street3}<br /></>}
                    {response.transactionBillingAddress.city}, {response.transactionBillingAddress.state} {response.transactionBillingAddress.postcode}<br />
                    {response.transactionBillingAddress.country}
                  </address>
                </div>
                {/* Shipping Address */}
                <div>
                  <span className="font-bold mb-1">Shipping Address:</span>
                  <address className="not-italic text-right">
                    {response.transactionShippingAddress.firstName} {response.transactionShippingAddress.lastName}<br />
                    {response.transactionShippingAddress.street1}<br />
                    {response.transactionShippingAddress.street2 && <>{response.transactionShippingAddress.street2}<br /></>}
                    {response.transactionShippingAddress.street3 && <>{response.transactionShippingAddress.street3}<br /></>}
                    {response.transactionShippingAddress.city}, {response.transactionShippingAddress.state} {response.transactionShippingAddress.postcode}<br />
                    {response.transactionShippingAddress.country}
                  </address>
                </div>
                <Divider />
                <div className="grid grid-cols-2 gap-2">
                  <span>Timestamp:</span>
                  <span className="text-right">{formattedDate(response.timestamp)}</span>
                </div>
              </div>
            </ModalBody>
            <Divider />
            <ModalFooterWithSupport
              actions={[
                {
                  label: "Close",
                  onClick: onClose,
                  className: "bg-ualert-500 text-notpurple-500"
                }
              ]}
              onSupportClick={handleSupportClick}
            />
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

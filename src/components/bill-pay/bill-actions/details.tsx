"use client";

import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";

import { useState } from "react";
import BillPayCloneModal from "./clone";
import IDSnippet from "../../generics/snippet-id";
import ModalFooterWithSupport from "../../generics/footer-modal-support";
import { DisbursementState, MerchantDisbursementEventGetOutput } from "@backpack-fux/pylon-sdk";
import { Input } from "@nextui-org/input";
import { Eye, EyeOff } from "lucide-react";

interface BillPayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  billPay: MerchantDisbursementEventGetOutput;
}

export default function BillPayDetailsModal({ isOpen, onClose, billPay }: BillPayDetailsModalProps) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSupportClick = () => {
    // Handle support action
    console.log("Support clicked");
  };

  const footerActions = [
    {
      label: "Clone and Edit",
      onClick: () => setIsCloneModalOpen(true),
    },
  ];

  return (
    <>
      <Modal isOpen={isOpen} size="lg" onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col items-center">
                <h2 className="text-2xl font-bold">Bill Pay Details</h2>
                <IDSnippet id={billPay.id} />
              </ModalHeader>
              <Divider />
              <ModalBody>
                <div className="space-y-4 font-mono">
                  <div className="flex justify-between">
                    <span>Vendor Name:</span>
                    <span>{billPay.contact.accountOwnerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span>{billPay.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bank Name:</span>
                    <span>{billPay.contact.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Routing Number:</span>
                    <span>{billPay.contact.routingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Number:</span>
                    <div className="w-48">
                      <Input
                        value={
                          isVisible
                            ? billPay.contact.accountNumber
                            : `${"•".repeat(
                                billPay.contact.accountNumber.length - 4
                              )}${billPay.contact.accountNumber.slice(-4)}`
                        }
                        isReadOnly
                        endContent={
                          <button
                            className="focus:outline-none"
                            type="button"
                            onClick={toggleVisibility}
                            aria-label="toggle account number visibility"
                          >
                            {isVisible ? (
                              <Eye className="text-2xl text-default-400 pointer-events-none" />
                            ) : (
                              <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                            )}
                          </button>
                        }
                        type="text"
                        className="max-w-xs"
                      />
                    </div>
                    {/* <span>**** {billPay.contact.accountNumber.slice(-4)}</span> */}
                  </div>
                  <Divider />
                  <div className="flex justify-between">
                    <span>Payment Reference:</span>
                    <span>{billPay.paymentMessage}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span>
                      ${Number(billPay.amountIn).toFixed(2)} {billPay.currencyIn}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Received:</span>
                    <span>
                      ${Number(billPay.amountOut).toFixed(2)} {billPay.currencyOut}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fee:</span>
                    <span>
                      ${Number(billPay.fee).toFixed(2)} {billPay.currencyOut}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>
                      ${(Number(billPay.amountOut) + Number(billPay.fee)).toFixed(2)} {billPay.currencyOut}
                    </span>
                  </div>
                  <Divider />
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`font-bold ${
                        billPay.state === DisbursementState.COMPLETED
                          ? "text-ualert-100"
                          : billPay.state === DisbursementState.PENDING
                            ? "text-ualert-300"
                            : "text-ualert-500"
                      }`}
                    >
                      {billPay.state}
                    </span>
                  </div>
                </div>
              </ModalBody>
              <Divider />
              <ModalFooterWithSupport onSupportClick={handleSupportClick} actions={footerActions} />
            </>
          )}
        </ModalContent>
      </Modal>
      <BillPayCloneModal
        billPay={billPay}
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onSave={(clonedBillPay) => {
          console.log("Cloning bill pay:", clonedBillPay);
          setIsCloneModalOpen(false);
        }}
      />
    </>
  );
}

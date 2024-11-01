"use client";

import { Divider } from "@nextui-org/divider";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";
import { useState } from "react";
import { DisbursementState, MerchantDisbursementEventGetOutput } from "@backpack-fux/pylon-sdk";
import { Input } from "@nextui-org/input";
import { Eye, EyeOff } from "lucide-react";

import ModalFooterWithSupport from "../../generics/footer-modal-support";
import IDSnippet from "../../generics/snippet-id";

import BillPayCloneModal from "./clone";

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
      <Modal isOpen={isOpen} scrollBehavior="inside" size="lg" onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col items-center">
                <h2 className="text-2xl font-bold">Bill Pay Details</h2>
                <IDSnippet id={billPay.id} />
              </ModalHeader>
              <Divider />
              <ModalBody>
                <div className="space-y-4 font-mono text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span>Vendor Name:</span>
                    <span className="text-right">{billPay.contact.accountOwnerName}</span>
                    <span>Payment Method:</span>
                    <span className="text-right">{billPay.paymentMethod}</span>
                    <span>Bank Name:</span>
                    <span className="text-right">{billPay.contact.bankName}</span>
                    <span>Routing Number:</span>
                    <span className="text-right">{billPay.contact.routingNumber}</span>
                    <span>Account Number:</span>
                    <div className="text-right">
                      <Input
                        isReadOnly
                        className="max-w-xs"
                        endContent={
                          <button
                            aria-label="toggle account number visibility"
                            className="focus:outline-none"
                            type="button"
                            onClick={toggleVisibility}
                          >
                            {isVisible ? (
                              <Eye className="text-2xl text-default-400 pointer-events-none" />
                            ) : (
                              <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                            )}
                          </button>
                        }
                        type="text"
                        value={
                          isVisible
                            ? billPay.contact.accountNumber
                            : `${"•".repeat(billPay.contact.accountNumber.length - 4)}${billPay.contact.accountNumber.slice(-4)}`
                        }
                      />
                    </div>
                  </div>
                  <Divider />
                  <div className="grid grid-cols-2 gap-2">
                    <span>Payment Reference:</span>
                    <span className="text-right">{billPay.paymentMessage}</span>
                  </div>
                  <Divider />
                  <div className="grid grid-cols-2 gap-2">
                    <span>Amount Paid:</span>
                    <span className="text-right">
                      ${Number(billPay.amountIn).toFixed(2)} {billPay.currencyIn}
                    </span>
                    <span>Amount Received:</span>
                    <span className="text-right">
                      ${Number(billPay.amountOut).toFixed(2)} {billPay.currencyOut}
                    </span>
                    <span>Fee:</span>
                    <span className="text-right">
                      ${Number(billPay.fee).toFixed(2)} {billPay.currencyOut}
                    </span>
                    <span className="font-bold">Total:</span>
                    <span className="text-right font-bold">
                      ${(Number(billPay.amountOut) + Number(billPay.fee)).toFixed(2)} {billPay.currencyOut}
                    </span>
                  </div>
                  <Divider />
                  <div className="grid grid-cols-2 gap-2">
                    <span>Status:</span>
                    <span
                      className={`text-right font-bold ${
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
              <ModalFooterWithSupport actions={footerActions} onSupportClick={handleSupportClick} />
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

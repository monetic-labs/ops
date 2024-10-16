"use client";

import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";

import { BillPay } from "@/data";
import { useState } from "react";
import BillPayCloneModal from "./bill-clone";
import IDSnippet from "../../generics/snippet-id";
import ModalFooterWithSupport from "../../generics/footer-modal-support";

interface BillPayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  billPay: BillPay;
}

export default function BillPayDetailsModal({ isOpen, onClose, billPay }: BillPayDetailsModalProps) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

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
                    <span>{billPay.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span>{billPay.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Routing Number:</span>
                    <span>{billPay.receivingBank.routingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Number:</span>
                    <span>**** {billPay.receivingBank.accountNumber.slice(-4)}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between">
                    <span>Memo:</span>
                    <span>{billPay.memo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Internal Note:</span>
                    <span>{billPay.internalNote}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>{billPay.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fee:</span>
                    <span>{billPay.fees}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{billPay.amount}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`font-bold ${
                        billPay.status === "Completed"
                          ? "text-ualert-100"
                          : billPay.status === "Pending"
                          ? "text-ualert-300"
                          : "text-ualert-500"
                      }`}
                    >
                      {billPay.status}
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

"use client";

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface RecoveryRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  // We can add an onConfirm a_props_if_needed if the page needs to know about successful submission
}

const RecoveryRequestModal: React.FC<RecoveryRequestModalProps> = ({ isOpen, onClose }) => {
  const [recoveryModalStep, setRecoveryModalStep] = useState<"warning" | "success">("warning");

  const handleRecoveryConfirm = () => {
    // In a real scenario, an API call would be made here.
    // For now, we just move to the success step.
    setRecoveryModalStep("success");
    // Potentially call an onSuccess prop if passed
  };

  // The onClose prop of HeroUI Modal will call this.
  // We also need to reset the step when the modal is fully closed.
  const handleModalClose = () => {
    onClose();
    // Delay resetting step to allow for exit animation if any
    setTimeout(() => {
      setRecoveryModalStep("warning");
    }, 300);
  };

  if (!isOpen) {
    return null; // Still good practice to return null if not open
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose} // Use the new handler
      backdrop="blur"
      size="xl" // Example size, can be adjusted
      shouldBlockScroll={true}
      // portalContainer={document.getElementById("modal-root")} // HeroUI Modal defaults to document.body
      // The class for custom animation like animate-fade-in might need to be applied via motionProps or directly if supported
    >
      <ModalContent className="bg-content1 shadow-xl">
        {/* Using a function for onClose in ModalContent might also work depending on HeroUI API */}
        {/* <ModalContent className="bg-content1 shadow-xl" onClose={handleModalClose}> */}
        {recoveryModalStep === "warning" && (
          <>
            <ModalHeader className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
                <h2 className="text-xl font-semibold text-foreground">Account Recovery Request</h2>
              </div>
            </ModalHeader>
            <ModalBody className="p-6 space-y-4">
              <p className="text-sm text-foreground-500">
                This action is intensive and only recommended if you have truly lost all your passkeys.
              </p>
              <ul className="list-disc list-inside space-y- text-sm text-foreground-500 pl-4">
                <li>The process may require KYC (Know Your Customer) verification.</li>
                <li>Other manual verification methods may be necessary.</li>
                <li>This process is labour-intensive and may involve third-party verification services.</li>
                <li>
                  The entire process typically takes about <strong>1-2 weeks</strong> to complete.
                </li>
              </ul>
              <p className="text-sm text-foreground-500 font-medium">Are you sure you want to proceed?</p>
            </ModalBody>
            <ModalFooter className="p-6 pt-4 flex justify-end gap-3">
              <Button variant="bordered" onPress={handleModalClose}>
                Cancel
              </Button>
              <Button color="danger" onPress={handleRecoveryConfirm}>
                Confirm Request
              </Button>
            </ModalFooter>
          </>
        )}
        {recoveryModalStep === "success" && (
          <>
            <ModalHeader className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
                <h2 className="text-xl font-semibold text-foreground">Request Sent</h2>
              </div>
            </ModalHeader>
            <ModalBody className="p-6 space-y-4">
              <p className="text-sm text-foreground-500">
                Your account recovery request has been successfully submitted.
              </p>
              <p className="text-sm text-foreground-500">
                You will receive communication from our support team shortly with the next steps. Please check your
                registered email.
              </p>
            </ModalBody>
            <ModalFooter className="p-6 pt-4 flex justify-end">
              <Button color="primary" onPress={handleModalClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default RecoveryRequestModal;

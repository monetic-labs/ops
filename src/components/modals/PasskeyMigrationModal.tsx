"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure, // Import useDisclosure hook for modal state management
} from "@heroui/modal"; // Import Modal components from @heroui/modal
import { Button } from "@heroui/button"; // Import Button separately
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation"; // Import useRouter

export function PasskeyMigrationModal() {
  const { isMigrationRequired, dismissMigrationPrompt } = useUser();
  // Use HeroUI's disclosure hook to manage modal open/close state synchronized with our context
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const router = useRouter(); // Initialize router

  // Effect to open the modal when isMigrationRequired becomes true
  React.useEffect(() => {
    if (isMigrationRequired) {
      onOpen();
    } else {
      // Don't auto-close if requirement changes while open
    }
  }, [isMigrationRequired, onOpen]);

  const handleRedirectToSettings = () => {
    // Dismiss the prompt so it doesn't reappear immediately
    dismissMigrationPrompt();
    // Redirect to security settings with a query param
    router.push("/settings/security?migration=required");
    // Optionally close the modal UI immediately, though redirection will handle it
    onClose();
  };

  // If the modal is not supposed to be open based on the disclosure state, don't render it.
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      isDismissable={false}
      hideCloseButton={true}
      backdrop="blur"
    >
      <ModalContent className="bg-content1 text-foreground">
        <ModalHeader className="flex flex-col gap-1 text-xl font-semibold">
          Action Required: Update Your Security
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-foreground-600">
            We&apos;ve migrated to a new platform for improved security and features. To ensure seamless access, please
            register a new passkey for your account on this site. This is a required step to secure your account.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={handleRedirectToSettings}>
            Go to Security Settings
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

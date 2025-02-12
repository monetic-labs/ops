import React from "react";
import { Modal, ModalContent, ModalBody } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { X as XIcon } from "lucide-react";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isValid?: boolean;
  title: React.ReactNode;
  children: React.ReactNode;
}

export function FormModal({ isOpen, onClose, onSubmit, isValid = true, title, children }: FormModalProps) {
  return (
    <Modal
      hideCloseButton
      classNames={{
        base: "bg-content1",
        backdrop: "bg-black/80",
        body: "p-0",
      }}
      isOpen={isOpen}
      size="md"
      onClose={onClose}
    >
      <ModalContent>
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
          {typeof title === "string" ? <h3 className="text-xl font-normal text-foreground">{title}</h3> : title}
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              className="text-foreground/60 hover:text-foreground transition-colors"
              variant="light"
              onClick={onClose}
            >
              <XIcon size={18} />
            </Button>
          </div>
        </div>
        <ModalBody className="p-6 max-h-[calc(80vh-130px)] overflow-y-auto">{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
}

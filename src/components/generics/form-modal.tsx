import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  isValid: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({ isOpen, onClose, title, children, onSubmit, isValid }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" data-testid="form-modal">
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
};

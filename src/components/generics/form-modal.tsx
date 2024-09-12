import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";

import { FormButton } from "./form-button";

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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          <FormButton className="text-notpurple-500" variant="light" onClick={onClose}>
            Cancel
          </FormButton>
          <FormButton disabled={!isValid} onClick={onSubmit}>
            Submit
          </FormButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

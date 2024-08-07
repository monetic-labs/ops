import { Button } from "@nextui-org/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // Replace 'any' with your user type
}

export default function UserDetailsModal({
  isOpen,
  onClose,
  user,
}: UserDetailsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{user.name}'s Details</ModalHeader>
        <ModalBody>
          {/* Add tabs or sections for issued cards and transactions */}
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

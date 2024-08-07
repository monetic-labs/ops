import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useState } from "react";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newUser: NewUser) => void;
}

interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const roles = ["Member", "Developer", "Bookkeeper", "Admin", "Super Admin"];

export default function CreateUserModal({
  isOpen,
  onClose,
  onSave,
}: CreateUserModalProps) {
  const [newUser, setNewUser] = useState<NewUser>({
    firstName: "",
    lastName: "",
    email: "",
    role: "User",
  });

  const handleSave = () => {
    onSave(newUser);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Create New User</ModalHeader>
        <ModalBody>
          <Input
            label="First Name"
            value={newUser.firstName}
            onChange={(e) =>
              setNewUser({ ...newUser, firstName: e.target.value })
            }
          />
          <Input
            label="Last Name"
            value={newUser.lastName}
            onChange={(e) =>
              setNewUser({ ...newUser, lastName: e.target.value })
            }
          />
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <Select
            label="Role"
            selectedKeys={[newUser.role]}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSave}>
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

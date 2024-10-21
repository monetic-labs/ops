import pylon from "@/libs/pylon-sdk";
import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useState } from "react";

interface CreateUserModalProps {
  isOpen: boolean;
  availableRoles: PersonRole[];
  onClose: () => void;
  onSave: (newUser: MerchantUserGetOutput) => void;
}

export default function CreateUserModal({ isOpen, availableRoles, onClose, onSave }: CreateUserModalProps) {
  const [newUser, setNewUser] = useState<MerchantUserGetOutput>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    role: PersonRole.MEMBER,
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const validateFields = () => {
    const nameRegex = /^[A-Za-z]+$/;
    const emailRegex = /\S+@\S+\.\S+/;
    const newErrors = {
      firstName: newUser.firstName
        ? nameRegex.test(newUser.firstName)
          ? ""
          : "First name must contain only letters"
        : "First name is required",
      lastName: newUser.lastName
        ? nameRegex.test(newUser.lastName)
          ? ""
          : "Last name must contain only letters"
        : "Last name is required",
      email: newUser.email ? (emailRegex.test(newUser.email) ? "" : "Invalid email address") : "Email is required",
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSave = async () => {
    if (validateFields()) {
      const user = await pylon.createUser({
        email: newUser.email.toLowerCase(),
        firstName: newUser.firstName.charAt(0).toUpperCase() + newUser.firstName.slice(1),
        lastName: newUser.lastName.charAt(0).toUpperCase() + newUser.lastName.slice(1),
        role: newUser.role,
      });
      if (user) {
        onSave(user);
        setNewUser({
          id: "",
          firstName: "",
          lastName: "",
          email: "",
          role: PersonRole.MEMBER,
        });
        onClose();
      } else {
        alert("Failed to create user");
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Create New User</ModalHeader>
        <ModalBody>
          <Input
            label="First Name"
            value={newUser.firstName}
            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
            isInvalid={!!errors.firstName}
            errorMessage={errors.firstName}
          />
          <Input
            label="Last Name"
            value={newUser.lastName}
            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
            isInvalid={!!errors.lastName}
            errorMessage={errors.lastName}
          />
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            isInvalid={!!errors.email}
            errorMessage={errors.email}
          />
          <Select
            label="Role"
            selectedKeys={[newUser.role]}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as PersonRole })}
          >
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (char) => char.toUpperCase())}
              </SelectItem>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Cancel</Button>
          <Button className="bg-ualert-500 text-notpurple-500" onPress={handleSave}>
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

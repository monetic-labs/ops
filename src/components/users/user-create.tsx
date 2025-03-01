import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useState } from "react";

import pylon from "@/libs/pylon-sdk";
import { capitalizeFirstChar } from "@/utils/helpers";

interface CreateUserModalProps {
  isOpen: boolean;
  availableRoles: PersonRole[];
  onClose: () => void;
  onSave: (newUser: MerchantUserGetOutput) => void;
}

export default function CreateUserModal({ isOpen, availableRoles, onClose, onSave }: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<MerchantUserGetOutput>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    role: PersonRole.MEMBER,
    pendingInvite: null,
    registeredPasskeys: [],
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

  const resetForm = () => {
    setNewUser({
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      role: PersonRole.MEMBER,
      pendingInvite: null,
      registeredPasskeys: [],
    });
    setErrors({
      firstName: "",
      lastName: "",
      email: "",
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!validateFields()) return;

    try {
      setIsLoading(true);
      setError(null);
      const user = await pylon.issueInvite({
        invites: [
          {
            email: newUser.email.toLowerCase(),
            firstName: capitalizeFirstChar(newUser.firstName),
            lastName: capitalizeFirstChar(newUser.lastName),
            role: newUser.role,
          },
        ],
      });

      if (user) {
        onSave({
          id: crypto.randomUUID(),
          firstName: capitalizeFirstChar(newUser.firstName),
          lastName: capitalizeFirstChar(newUser.lastName),
          email: newUser.email.toLowerCase(),
          role: newUser.role,
          pendingInvite: {
            id: user.invitedUsers[0].id,
            isUsed: false,
            expiresAt: user.invitedUsers[0].expiresAt,
          },
          registeredPasskeys: [], // No passkeys registered
        });
        resetForm();
      } else {
        throw new Error("Failed to create user");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-normal">Create New User</h3>
          {error && <p className="text-danger text-sm">{error}</p>}
        </ModalHeader>
        <ModalBody>
          <Input
            errorMessage={errors.firstName}
            isInvalid={!!errors.firstName}
            label="First Name"
            value={newUser.firstName}
            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
          />
          <Input
            errorMessage={errors.lastName}
            isInvalid={!!errors.lastName}
            label="Last Name"
            value={newUser.lastName}
            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
          />
          <Input
            errorMessage={errors.email}
            isInvalid={!!errors.email}
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
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
          <Button className="bg-content2 text-foreground hover:bg-content3" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            className="bg-primary text-primary-foreground"
            isDisabled={isLoading}
            isLoading={isLoading}
            onPress={handleSave}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

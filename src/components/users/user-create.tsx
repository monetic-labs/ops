"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { PersonRole, MerchantUserCreateInput } from "@monetic-labs/sdk";

import { capitalizeFirstChar, formatStringToTitleCase } from "@/utils/helpers";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: MerchantUserCreateInput) => void;
  availableRoles: PersonRole[];
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  role: PersonRole;
}

export default function CreateUserModal({ isOpen, onClose, onSave, availableRoles }: CreateUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: PersonRole.MEMBER,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newUser: MerchantUserCreateInput = {
      firstName: capitalizeFirstChar(formData.firstName),
      lastName: capitalizeFirstChar(formData.lastName),
      email: formData.email.toLowerCase(),
      role: formData.role,
    };

    onSave(newUser);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: PersonRole.MEMBER,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        {() => (
          <form onSubmit={handleSubmit}>
            <ModalHeader>Add Team Member</ModalHeader>
            <ModalBody className="gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="First Name"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  variant="bordered"
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                />
                <Input
                  isRequired
                  label="Last Name"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  variant="bordered"
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <Input
                isRequired
                label="Email"
                placeholder="Enter email address"
                type="email"
                value={formData.email}
                variant="bordered"
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Select
                isRequired
                label="Role"
                placeholder="Select role"
                selectedKeys={[formData.role]}
                variant="bordered"
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as PersonRole }))}
              >
                {availableRoles.map((role) => (
                  <SelectItem key={role} textValue={formatStringToTitleCase(role)}>
                    {formatStringToTitleCase(role)}
                  </SelectItem>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                Add Member
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}

import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useState } from "react";

interface UserEditModalProps {
  isOpen: boolean;
  user: MerchantUserGetOutput;
  isSelf: boolean;
  isEditable: boolean;
  availableRoles: PersonRole[];
  onClose: () => void;
  onSave: (updatedUser: MerchantUserGetOutput) => void;
  onRemove: (userId: string) => void;
}

export default function UserEditModal({
  isOpen,
  user,
  isSelf,
  isEditable,
  availableRoles,
  onClose,
  onSave,
  onRemove,
}: UserEditModalProps) {
  const [editedUser, setEditedUser] = useState<MerchantUserGetOutput>({ ...user });
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  const fullName = `${user.firstName} ${user.lastName}`;

  const handleSave = () => {
    onSave(editedUser);
  };

  const handleRemove = () => {
    onRemove(user.id);
    setIsRemoveConfirmOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-normal">Edit User - {fullName}</h3>
        </ModalHeader>
        <ModalBody>
          <Input
            isDisabled={!isEditable}
            label="First Name"
            value={editedUser.firstName}
            onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
          />
          <Input
            isDisabled={!isEditable}
            label="Last Name"
            value={editedUser.lastName}
            onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
          />
          <Input
            isDisabled={!isEditable}
            label="Username"
            value={editedUser.username || ""}
            onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
          />
          <Input
            isDisabled={!isEditable}
            label="Email"
            type="email"
            value={editedUser.email}
            onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
          />
          <Input
            isDisabled={!isEditable}
            label="Phone"
            value={editedUser.phone || ""}
            onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
          />
          <Select
            isDisabled={!isEditable}
            label="Role"
            selectedKeys={[editedUser.role]}
            onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as PersonRole })}
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
          {/* <Switch
            classNames={{ wrapper: "bg-ualert-500" }}
            isSelected={editedUser.status === "Active"}
            onValueChange={(isActive) =>
              setEditedUser({
                ...editedUser,
                status: isActive ? "Active" : "Inactive",
              })
            }
          >
            {editedUser.status === "Active" ? "Active" : "Suspended"}
          </Switch> */}
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-between w-full">
            <Button
              className="bg-danger text-danger-foreground"
              isDisabled={isSelf || !isEditable}
              onPress={() => setIsRemoveConfirmOpen(true)}
            >
              Remove User
            </Button>
            <div className="flex gap-2">
              <Button className="bg-content2 text-foreground hover:bg-content3" onPress={onClose}>
                Cancel
              </Button>
              <Button className="bg-primary text-primary-foreground" isDisabled={!isEditable} onPress={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>

      {/* Confirmation Modal for Remove User */}
      <Modal isOpen={isRemoveConfirmOpen} onClose={() => setIsRemoveConfirmOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-normal">Confirm Removal</h3>
          </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to remove {fullName}? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button
              className="bg-content2 text-foreground hover:bg-content3"
              onPress={() => setIsRemoveConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-danger text-danger-foreground" onPress={handleRemove}>
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Modal>
  );
}

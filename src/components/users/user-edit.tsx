import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { Switch } from "@nextui-org/switch";
import { useState } from "react";

interface User {
  name: string;
  role: string;
  email: string;
  status: string;
  actions?: string; // Make this optional as it might not be needed in the edit modal
}

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedUser: User) => void;
  onRemove: (userId: string) => void;
}

const roles = ["Member", "Developer", "Bookkeeper", "Admin", "Super Admin"];

export default function UserEditModal({ isOpen, onClose, user, onSave, onRemove }: UserEditModalProps) {
  const [editedUser, setEditedUser] = useState<User>({ ...user });
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  const handleSave = () => {
    onSave(editedUser);
    onClose();
  };

  const handleRemove = () => {
    onRemove(user.name);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Edit {user.name}</ModalHeader>
        <ModalBody>
          <Input
            label="Name"
            value={editedUser.name}
            onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
          />
          <Select
            label="Role"
            selectedKeys={[editedUser.role]}
            onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
          >
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </Select>
          <Switch
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
          </Switch>
        </ModalBody>
        <ModalFooter>
          <Button className="bg-ualert-500 text-notpurple-500" onPress={() => setIsRemoveConfirmOpen(true)}>
            Remove User
          </Button>
          <Button onPress={onClose}>Cancel</Button>
          <Button color="primary" onPress={handleSave}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>

      {/* Confirmation Modal for Remove User */}
      <Modal isOpen={isRemoveConfirmOpen} onClose={() => setIsRemoveConfirmOpen(false)}>
        <ModalContent>
          <ModalHeader>Confirm Removal</ModalHeader>
          <ModalBody>Are you sure you want to remove {user.name}? This action cannot be undone.</ModalBody>
          <ModalFooter>
            <Button onPress={() => setIsRemoveConfirmOpen(false)}>Cancel</Button>
            <Button className="bg-ualert-600 text-notpurple-500" onPress={handleRemove}>
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Modal>
  );
}

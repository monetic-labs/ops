import { MerchantUserGetOutput, PersonRole } from "@monetic-labs/sdk";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { User as HeroUser } from "@heroui/user";
import { useState, useEffect } from "react";
import { formatPhoneNumber, formatStringToTitleCase, getFullName, getOpepenAvatar } from "@/utils/helpers";
import { useToast } from "@/hooks/generics/useToast";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";

interface UserEditModalProps {
  isOpen: boolean;
  user: MerchantUserGetOutput;
  isSelf: boolean;
  isEditable: boolean;
  availableRoles: PersonRole[];
  onClose: () => void;
  onSave: (updatedUser: MerchantUserGetOutput) => Promise<boolean>;
  onRemove: (userId: string) => Promise<boolean>;
}

// Main component
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
  // State
  const [editedUser, setEditedUser] = useState<MerchantUserGetOutput>({ ...user });
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  // Hooks
  const { toast } = useToast();
  const { selectCredential } = usePasskeySelection();

  const fullName = getFullName(user.firstName, user.lastName);

  // Validation helpers
  const isEmailValid = (email: string) => {
    return email && /\S+@\S+\.\S+/.test(email);
  };

  const isPhoneValid = (phone: string) => {
    return phone && phone.replace(/\D/g, "").length >= 10;
  };

  // Masking functions
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    if (!domain) return email;
    return `${username.slice(0, 3)}***@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return "";
    const numbers = phone.replace(/\D/g, "");
    if (numbers.length < 7) return formatPhoneNumber(phone);
    const areaCode = numbers.slice(0, 3);
    const lastFour = numbers.slice(-4);
    return `(${areaCode}) •••-${lastFour}`;
  };

  // Reset editedUser when modal opens or user prop changes
  useEffect(() => {
    setEditedUser({ ...user });
  }, [isOpen, user]);

  // Event handlers
  const handleSave = async () => {
    try {
      // Only save if role has changed (other fields are read-only)
      if (editedUser.role !== user.role) {
        const success = await onSave(editedUser);
        if (!success) return;
      }
      onClose();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleRemove = async () => {
    try {
      const success = await onRemove(user.id);
      if (success) {
        setIsRemoveConfirmOpen(false);
        onClose();
      }
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  // Main render
  return (
    <>
      <Modal
        classNames={{
          base: "max-w-xl",
          body: "py-6",
          header: "border-b border-default-100",
          closeButton: "hover:bg-default-100",
        }}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <HeroUser
                avatarProps={{
                  radius: "lg",
                  size: "lg",
                  src: getOpepenAvatar(fullName, 64),
                }}
                description={editedUser.username || editedUser.email}
                name={fullName}
              />
            </div>
          </ModalHeader>
          <Divider />
          <ModalBody className="overflow-y-auto max-h-[50vh] relative px-6">
            <div className="space-y-6">
              {/* Personal Information - Always Disabled */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground/70">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input isDisabled label="First Name" value={editedUser.firstName} variant="bordered" />
                  <Input isDisabled label="Last Name" value={editedUser.lastName} variant="bordered" />
                </div>
              </div>

              {/* Contact Information - Always Disabled */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground/70">Contact Information</h3>
                <div className="grid gap-4">
                  <Input isDisabled label="Username" value={editedUser.username || ""} variant="bordered" />
                  <Input isDisabled label="Email" value={maskEmail(editedUser.email)} variant="bordered" />
                  <Input isDisabled label="Phone" value={maskPhone(editedUser.phone || "")} variant="bordered" />
                </div>
              </div>

              {/* Role & Permissions - Editable based on isEditable prop */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground/70">Role & Permissions</h3>
                <Select
                  isDisabled={!isEditable}
                  label="Role"
                  placeholder="Select role"
                  selectedKeys={[editedUser.role]}
                  variant="bordered"
                  onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as PersonRole })}
                >
                  {availableRoles.map((role) => (
                    <SelectItem key={role} textValue={formatStringToTitleCase(role)}>
                      {formatStringToTitleCase(role)}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </ModalBody>
          <Divider />
          <ModalFooter>
            <div className="flex justify-between w-full">
              <Button
                className="bg-danger/10 text-danger hover:bg-danger/20"
                isDisabled={!isEditable}
                variant="flat"
                onPress={() => setIsRemoveConfirmOpen(true)}
              >
                Remove User
              </Button>
              <div className="flex gap-2">
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" isDisabled={!isEditable} onPress={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Confirmation Modal for Remove User */}
      <Modal isOpen={isRemoveConfirmOpen} size="sm" onClose={() => setIsRemoveConfirmOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-normal">Confirm Removal</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-foreground/70">
              Are you sure you want to remove {fullName}? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsRemoveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleRemove}>
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { Divider } from "@nextui-org/divider";
import { User } from "@nextui-org/user";
import { useState } from "react";
import { Eye, EyeOff, Fingerprint, Plus, Trash2 } from "lucide-react";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import { Tooltip } from "@nextui-org/tooltip";

import { formatPhoneNumber, getOpepenAvatar } from "@/utils/helpers";
import { addPasskeyToSafe } from "@/utils/safe/passkey";
import { useToast } from "@/hooks/useToast";
import { useUser } from "@/contexts/UserContext";
import { WebAuthnHelper } from "@/utils/webauthn";

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
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);
  const { getSigningCredentials } = useUser();
  const { toast } = useToast();

  const fullName = `${user.firstName} ${user.lastName}`;

  const handleSave = () => {
    onSave(editedUser);
    onClose();
  };

  const handleRemove = () => {
    onRemove(user.id);
    setIsRemoveConfirmOpen(false);
    onClose();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only keep numbers
    const numbers = e.target.value.replace(/\D/g, "");

    setEditedUser({ ...editedUser, phone: numbers });
  };

  // Helper function to mask email
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [username, domain] = email.split("@");

    if (!domain) return email;

    return `${username.slice(0, 3)}***@${domain}`;
  };

  // Helper function to mask phone
  const maskPhone = (phone: string) => {
    if (!phone) return "";
    // Remove any non-numeric characters first
    const numbers = phone.replace(/\D/g, "");

    if (numbers.length !== 10) return formatPhoneNumber(phone); // If not a 10-digit number, just format it

    // Format the masked number
    const areaCode = numbers.slice(0, 3);
    const lastFour = numbers.slice(-4);

    return `(${areaCode}) •••-${lastFour}`;
  };

  const handleAddPasskey = async () => {
    try {
      setIsAddingPasskey(true);

      // 1. Add passkey to new safe individual account
      // 2. Add passkey to existing safe individual account

      if (!user.walletAddress) {
        throw new Error("No wallet address found");
      }

      const credentials = getSigningCredentials();
      if (!credentials) {
        throw new Error("No passkey found");
      }

      const result = await addPasskeyToSafe({
        safeAddress: user.walletAddress as `0x${string}`,
        userEmail: user.email,
        credential: {
          publicKey: credentials.publicKey,
          credentialId: credentials.credentialId,
        },
        callbacks: {
          onSent: () => {
            toast({
              title: "Adding passkey...",
              description: "Please wait while we add your passkey to your account",
            });
          },
          onSuccess: () => {
            toast({
              title: "Passkey added!",
              description: "Your new passkey has been added to your account",
            });
          },
          onError: (error: Error) => {
            toast({
              title: "Error adding passkey",
              description: error.message,
              variant: "destructive",
            });
          },
        },
      });

      // Optimistically update the UI with the new passkey
      const newPasskey = {
        credentialId: result.credentialId,
        publicKey: result.publicKey,
        displayName: "New Passkey",
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        counter: 0,
      };

      setEditedUser((prev) => ({
        ...prev,
        registeredPasskeys: [...(prev.registeredPasskeys || []), newPasskey],
      }));
    } catch (error) {
      console.error("Failed to add passkey:", error);
      toast({
        title: "Error adding passkey",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAddingPasskey(false);
    }
  };

  return (
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
            <User
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
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground/70">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isDisabled={!isEditable}
                  label="First Name"
                  placeholder="Enter first name"
                  value={editedUser.firstName}
                  variant="bordered"
                  onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                />
                <Input
                  isDisabled={!isEditable}
                  label="Last Name"
                  placeholder="Enter last name"
                  value={editedUser.lastName}
                  variant="bordered"
                  onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground/70">Contact Information</h3>
              <div className="grid gap-4">
                <Input
                  isDisabled={!isEditable}
                  label="Username"
                  placeholder="Enter username"
                  value={editedUser.username || ""}
                  variant="bordered"
                  onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                />
                <Input
                  endContent={
                    <Button
                      isIconOnly
                      className="bg-transparent"
                      radius="full"
                      size="sm"
                      variant="light"
                      onPress={() => setShowEmail(!showEmail)}
                    >
                      {showEmail ? (
                        <Eye className="w-4 h-4 text-default-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-default-400" />
                      )}
                    </Button>
                  }
                  isDisabled={!isEditable}
                  label="Email"
                  placeholder="Enter email address"
                  type="email"
                  value={showEmail ? editedUser.email : maskEmail(editedUser.email)}
                  variant="bordered"
                  onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                />
                <Input
                  endContent={
                    <Button
                      isIconOnly
                      className="bg-transparent"
                      radius="full"
                      size="sm"
                      variant="light"
                      onPress={() => setShowPhone(!showPhone)}
                    >
                      {showPhone ? (
                        <Eye className="w-4 h-4 text-default-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-default-400" />
                      )}
                    </Button>
                  }
                  isDisabled={!isEditable}
                  label="Phone"
                  placeholder="Enter phone number"
                  value={
                    showPhone
                      ? editedUser.phone
                        ? formatPhoneNumber(editedUser.phone)
                        : ""
                      : maskPhone(editedUser.phone || "")
                  }
                  variant="bordered"
                  onChange={handlePhoneChange}
                />
              </div>
            </div>

            {/* Role & Permissions */}
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
                  <SelectItem key={role} value={role}>
                    {role
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (char) => char.toUpperCase())}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Security & Passkeys */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/70">Security & Passkeys</h3>
                {isSelf && (
                  <Tooltip
                    content={
                      editedUser.registeredPasskeys?.length
                        ? "Only one passkey is allowed per user"
                        : "Add a passkey to enable passwordless login"
                    }
                  >
                    <Button
                      className="bg-primary/10 text-primary"
                      endContent={<Plus className="w-4 h-4" />}
                      isLoading={isAddingPasskey}
                      // isDisabled={Boolean(editedUser.registeredPasskeys?.length)}
                      size="sm"
                      variant="flat"
                      onPress={handleAddPasskey}
                    >
                      Add Passkey
                    </Button>
                  </Tooltip>
                )}
              </div>

              <ScrollShadow className="max-h-[200px]">
                <div className="space-y-2">
                  {editedUser.registeredPasskeys && editedUser.registeredPasskeys.length > 0 ? (
                    editedUser.registeredPasskeys.map((passkey) => (
                      <div
                        key={passkey.credentialId}
                        className="flex items-center justify-between p-3 rounded-lg bg-content2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Fingerprint className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <Input
                              classNames={{
                                input: "text-sm",
                                inputWrapper:
                                  "border-transparent bg-transparent hover:bg-content3 data-[hover=true]:bg-content3 group-data-[focus=true]:bg-content3 min-h-unit-8",
                              }}
                              isDisabled={!isSelf}
                              placeholder="Unnamed Device"
                              size="sm"
                              value={passkey.displayName || ""}
                              variant="bordered"
                              onChange={(e) => {
                                const updatedPasskeys = editedUser.registeredPasskeys?.map((p) =>
                                  p.credentialId === passkey.credentialId ? { ...p, displayName: e.target.value } : p
                                );

                                setEditedUser({
                                  ...editedUser,
                                  registeredPasskeys: updatedPasskeys,
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Tooltip content="Remove passkey (Coming soon)">
                            <Button isDisabled isIconOnly className="bg-transparent" size="sm" variant="light">
                              <Trash2 className="w-4 h-4 text-danger/70" />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="p-3 rounded-full bg-primary/10 mb-3">
                        <Fingerprint className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium">No Passkeys Registered</p>
                      <p className="text-xs text-foreground/50 mt-1">
                        {isSelf ? "Add a passkey to enable passwordless login" : "This user has no registered passkeys"}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollShadow>
            </div>
          </div>
        </ModalBody>
        <Divider />
        <ModalFooter>
          <div className="flex justify-between w-full">
            <Button
              className="bg-danger/10 text-danger hover:bg-danger/20"
              isDisabled={isSelf}
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
    </Modal>
  );
}

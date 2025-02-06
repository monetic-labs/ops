"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalBody } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Avatar } from "@nextui-org/avatar";
import { XIcon, Upload, Trash2 } from "lucide-react";

import { formatPhoneNumber } from "@/utils/helpers";
import { ExtendedMerchantUser } from "@/contexts/AccountContext";
import { LocalStorage } from "@/utils/localstorage";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ExtendedMerchantUser;
}

export const ProfileSettingsModal = ({ isOpen, onClose, user }: ProfileSettingsModalProps) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load profile image from localStorage when modal opens
      const storedImage = LocalStorage.getSafeUser()?.profileImage;

      setProfileImage(storedImage || null);
    }
  }, [isOpen]); // Only depend on isOpen to prevent unnecessary reloads

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");

        return;
      }

      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const base64String = reader.result;

          setProfileImage(base64String);
          LocalStorage.setProfileImage(base64String);
          // Force a re-render of components using the image
          window.dispatchEvent(new Event("storage"));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    LocalStorage.removeProfileImage();
    // Force a re-render of components using the image
    window.dispatchEvent(new Event("storage"));
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "";

    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Modal
      hideCloseButton
      classNames={{
        base: "bg-content1",
        backdrop: "bg-black/50 backdrop-blur-sm",
        body: "p-0",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider">
          <div className="flex flex-col">
            <h3 className="text-xl font-normal text-foreground">Profile Settings</h3>
            <p className="text-sm text-foreground-400">Account ID: {user.id ?? "N/A"}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              className="text-foreground-400 hover:text-foreground transition-colors"
              variant="light"
              onClick={onClose}
            >
              <XIcon size={18} />
            </Button>
          </div>
        </div>
        <ModalBody className="overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar
                isBordered
                className="w-16 h-16"
                classNames={{
                  base: "bg-primary/10",
                  icon: "text-primary",
                }}
                name={getInitials(user.firstName, user.lastName)}
                showFallback={!profileImage}
                src={profileImage || undefined}
              />
              <div className="flex flex-col gap-2">
                <Button
                  as="label"
                  color="primary"
                  size="sm"
                  startContent={<Upload className="w-4 h-4" />}
                  variant="flat"
                >
                  Change Picture
                  <input accept="image/*" className="hidden" type="file" onChange={handleImageUpload} />
                </Button>
                {profileImage && (
                  <Button
                    color="danger"
                    size="sm"
                    startContent={<Trash2 className="w-4 h-4" />}
                    variant="flat"
                    onClick={handleRemoveImage}
                  >
                    Remove Picture
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input isDisabled label="First Name" value={user.firstName} />
                <Input isDisabled label="Last Name" value={user.lastName} />
              </div>
              <Input label="Username" value={user.username} />
              <Input label="Phone Number" type="tel" value={formatPhoneNumber(user.phone)} />
              <Input isDisabled label="Email" value={user.email} />
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

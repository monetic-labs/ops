"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalBody } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Avatar } from "@nextui-org/avatar";
import { XIcon, Upload, Trash2 } from "lucide-react";
import { MerchantUserGetByIdOutput as MerchantUser } from "@backpack-fux/pylon-sdk";
import { useToast } from "@/hooks/useToast";

import { formatPhoneNumber } from "@/utils/helpers";
import { useUser } from "@/contexts/UserContext";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MerchantUser;
}

export const ProfileSettingsModal = ({ isOpen, onClose, user }: ProfileSettingsModalProps) => {
  const { profile, updateProfileImage } = useUser();
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Reset state when modal opens/closes and when profile changes
  useEffect(() => {
    setImageFile(profile?.profileImage || null);
  }, [isOpen, profile?.profileImage]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      // Set the image file state first for immediate visual feedback
      setImageFile(base64);

      // Then update the profile
      await updateProfileImage(base64);

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      // Reset the image file state if the update failed
      setImageFile(profile?.profileImage || null);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      await updateProfileImage(null);
      setImageFile(null);
      toast({
        title: "Success",
        description: "Profile picture removed successfully",
      });
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setImageFile(profile?.profileImage || null); // Reset to current profile image
    onClose();
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
      onClose={handleClose}
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
              onClick={handleClose}
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
                showFallback={!imageFile}
                src={imageFile || undefined}
              />
              <div className="flex flex-col gap-2">
                <Button
                  as="label"
                  color="primary"
                  isDisabled={isUploading}
                  isLoading={isUploading}
                  size="sm"
                  startContent={<Upload className="w-4 h-4" />}
                  variant="flat"
                >
                  {isUploading ? "Uploading..." : "Change Picture"}
                  <input accept="image/*" className="hidden" type="file" onChange={handleImageUpload} />
                </Button>
                {imageFile && (
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

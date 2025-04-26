"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Upload, Trash2, Copy } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/generics/useToast";
import { formatPhoneNumber } from "@/utils/helpers";
import { Spinner } from "@heroui/spinner";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import type { MerchantUserUpdateInput } from "@monetic-labs/sdk";
import { truncateAddress } from "@/utils/helpers";

// Helper function implemented locally
const normalizePhoneNumber = (phone: string | undefined | null): string => {
  return phone ? phone.replace(/\D/g, "") : "";
};

export default function ProfileSettingsPage() {
  const { user, profile, updateProfileImage, updateUserDetails, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // State for editable fields
  const [usernameInput, setUsernameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Initialize editable fields from user context
  useEffect(() => {
    if (user) {
      setUsernameInput(user.username || "");
      setPhoneInput(formatPhoneNumber(user.phone) || "");
    }
  }, [user]);

  // Set initial image from profile context
  useEffect(() => {
    setImageFile(profile?.profileImage || null);
  }, [profile?.profileImage]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast({ title: "File too large", description: "Image size should be less than 5MB", variant: "destructive" });
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

      setImageFile(base64); // Optimistic update UI
      await updateProfileImage(base64); // Update backend
      toast({ title: "Success", description: "Profile picture updated successfully" });
    } catch (error) {
      console.error("Error uploading image:", error);
      setImageFile(profile?.profileImage || null); // Revert UI on error
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
    setIsUploading(true); // Use uploading state for visual feedback
    try {
      await updateProfileImage(null);
      setImageFile(null);
      toast({ title: "Success", description: "Profile picture removed successfully" });
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "?"; // Fallback for missing names
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  // --- Calculate if details have changed ---
  const hasDetailsChanged = useMemo(() => {
    if (!user) return false;
    const normalizedCurrentPhone = normalizePhoneNumber(user.phone);
    const normalizedInputPhone = normalizePhoneNumber(phoneInput);
    return usernameInput !== (user.username || "") || normalizedInputPhone !== normalizedCurrentPhone;
  }, [user, usernameInput, phoneInput]);

  // --- Save Details Handler ---
  const handleSaveDetails = async () => {
    if (!user || !hasDetailsChanged) return;

    setIsSavingDetails(true);
    try {
      const normalizedInputPhone = normalizePhoneNumber(phoneInput);
      const currentNormalizedPhone = normalizePhoneNumber(user.phone);

      // Check if any user-editable field actually changed
      const actualDetailsChanged =
        usernameInput !== (user.username || "") || normalizedInputPhone !== currentNormalizedPhone;

      if (!actualDetailsChanged) {
        // Avoid sending update if no user-editable fields changed
        toast({ title: "No changes", description: "No profile details were modified." });
        setIsSavingDetails(false);
        return;
      }

      // Construct payload including *all* relevant editable fields,
      // using their current values from the input state.
      const updatePayload: MerchantUserUpdateInput = {
        // Include wallet address if it exists (as per previous logic, though possibly not needed)
        ...(user.walletAddress && { walletAddress: user.walletAddress }),
        username: usernameInput, // Always send current input username
        phone: normalizedInputPhone, // Always send normalized version of current input phone
      };

      // Call updateUserDetails from UserContext
      await updateUserDetails(updatePayload);

      toast({ title: "Success", description: "Personal information updated." });
    } catch (error: any) {
      console.error("Error updating details:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDetails(false);
    }
  };

  // --- Copy Handlers ---
  const handleCopy = async (textToCopy: string | undefined | null, fieldName: string) => {
    if (!textToCopy) {
      toast({ title: "Nothing to copy", description: `${fieldName} is empty.` });
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({ title: "Copied to clipboard", description: `${fieldName} copied successfully.` });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Copy Failed",
        description: `Could not copy ${fieldName.toLowerCase()}.`,
        variant: "destructive",
      });
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile Settings</h1>
        <p className="text-sm text-foreground-500 mt-1">Manage your personal profile details.</p>
      </div>

      <Card className="max-w-4xl" shadow="none" classNames={{ base: "border border-divider" }}>
        <CardHeader>
          <h2 className="text-lg font-medium">Profile Picture</h2>
        </CardHeader>
        <CardBody className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
          <Avatar
            isBordered
            className="w-20 h-20 flex-shrink-0"
            classNames={{ base: "bg-primary/10", icon: "text-primary text-2xl" }}
            name={getInitials(user.firstName, user.lastName)}
            showFallback={!imageFile}
            src={imageFile || undefined}
          />
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <Button
              as="label"
              color="primary"
              isDisabled={isUploading}
              isLoading={isUploading}
              size="sm"
              startContent={<Upload className="w-4 h-4" />}
              variant="flat"
              className="cursor-pointer"
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
                isDisabled={isUploading}
              >
                Remove Picture
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="max-w-4xl" shadow="none" classNames={{ base: "border border-divider" }}>
        <CardHeader>
          <h2 className="text-lg font-medium">Personal Information</h2>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input isDisabled label="First Name" value={user.firstName || ""} variant="bordered" />
            <Input isDisabled label="Last Name" value={user.lastName || ""} variant="bordered" />
          </div>
          <Input
            label="Username"
            value={usernameInput}
            onValueChange={setUsernameInput}
            variant="bordered"
            placeholder="Enter username"
          />
          <Input
            label="Phone Number"
            type="tel"
            value={formatPhoneNumber(phoneInput)}
            onValueChange={setPhoneInput}
            variant="bordered"
          />
          <Input isDisabled label="Email" value={user.email || "N/A"} variant="bordered" />
          <Input
            isReadOnly
            label="Wallet Address"
            value={truncateAddress(user.walletAddress) || "N/A"}
            variant="bordered"
            classNames={{ input: "font-mono" }} // Use mono font for address
            endContent={
              user.walletAddress ? (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-foreground/60 hover:text-foreground/90"
                  onPress={() => handleCopy(user.walletAddress, "Wallet Address")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              ) : null
            }
          />
          <Input
            isReadOnly
            label="Account ID"
            value={user.id || "N/A"}
            variant="bordered"
            endContent={
              user.id ? (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-foreground/60 hover:text-foreground/90"
                  onPress={() => handleCopy(user.id, "Account ID")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              ) : null
            }
          />
        </CardBody>
        <CardFooter className="border-t border-divider pt-4 flex justify-end">
          <Button
            color="primary"
            isDisabled={!hasDetailsChanged || isSavingDetails}
            isLoading={isSavingDetails}
            onPress={handleSaveDetails}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

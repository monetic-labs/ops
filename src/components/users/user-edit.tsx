import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { Divider } from "@nextui-org/divider";
import { User } from "@nextui-org/user";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Fingerprint, Plus, Trash2, CheckCircle, AlertCircle, Clock, Info } from "lucide-react";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import { Tooltip } from "@nextui-org/tooltip";
import { Chip } from "@nextui-org/chip";

import { formatPhoneNumber, getOpepenAvatar } from "@/utils/helpers";
import {
  addPasskeyToSafe,
  PasskeyStatus,
  syncPasskeysWithSafe,
  PasskeyWithStatus,
} from "@/utils/safe/features/passkey";
import { deployIndividualSafe } from "@/utils/safe/features/deploy";
import { useToast } from "@/hooks/generics/useToast";
import { useUser } from "@/contexts/UserContext";
import { Address, Hex } from "viem";
import { PublicKey } from "ox";

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
  const [passkeysWithStatus, setPasskeysWithStatus] = useState<PasskeyWithStatus[]>([]);
  const [isSyncingPasskeys, setIsSyncingPasskeys] = useState(false);
  const [skipNextSync, setSkipNextSync] = useState(false);
  const { getCredentials } = useUser();
  const { toast } = useToast();

  const fullName = `${user.firstName} ${user.lastName}`;

  // Add validation check for email and phone
  const isEmailValid = (email: string) => {
    return email && /\S+@\S+\.\S+/.test(email);
  };

  const isPhoneValid = (phone: string) => {
    return phone && phone.replace(/\D/g, "").length >= 10;
  };

  // Check if there's at least one active passkey on-chain
  const hasActiveOnchainPasskey = passkeysWithStatus.some((p) => p.status === PasskeyStatus.ACTIVE_ONCHAIN);

  // Only require email/phone validation for first passkey or if no active passkeys exist
  const isValidForPasskey =
    hasActiveOnchainPasskey || (isEmailValid(editedUser.email) && isPhoneValid(editedUser.phone || ""));

  // Sync passkeys when the modal opens or when user data changes
  useEffect(() => {
    const syncPasskeys = async () => {
      if (skipNextSync) {
        setSkipNextSync(false);
        return;
      }

      if (!editedUser.walletAddress || !editedUser.registeredPasskeys?.length) {
        // If no wallet or no passkeys, reset the state
        setPasskeysWithStatus(
          (editedUser.registeredPasskeys || []).map((passkey) => ({
            ...passkey,
            displayName: passkey.displayName || "Unnamed Device",
            status: PasskeyStatus.UNKNOWN,
            lastUsedAt: passkey.lastUsedAt || new Date().toISOString(),
            publicKey: passkey.publicKey || "",
          }))
        );
        return;
      }

      try {
        setIsSyncingPasskeys(true);

        const syncedPasskeys = await syncPasskeysWithSafe(
          editedUser.walletAddress as Address,
          editedUser.registeredPasskeys
        );

        setPasskeysWithStatus(syncedPasskeys);
      } catch (error) {
        console.error("Error syncing passkeys:", error);
        // Fall back to unsynchronized display
        setPasskeysWithStatus(
          (editedUser.registeredPasskeys || []).map((passkey) => ({
            ...passkey,
            displayName: passkey.displayName || "Unnamed Device",
            status: PasskeyStatus.UNKNOWN,
            lastUsedAt: passkey.lastUsedAt || new Date().toISOString(),
            publicKey: passkey.publicKey || "",
          }))
        );
      } finally {
        setIsSyncingPasskeys(false);
      }
    };

    if (isOpen && !isAddingPasskey) {
      syncPasskeys();
    }
  }, [isOpen, editedUser.walletAddress, editedUser.registeredPasskeys, skipNextSync, isAddingPasskey]);

  const handleSave = async () => {
    try {
      // Create a copy of the edited user to avoid modifying the original
      const userToSave = { ...editedUser };

      // If walletAddress is null/undefined/empty, remove it from the object to avoid schema validation issues
      if (!userToSave.walletAddress) {
        delete userToSave.walletAddress;
      }

      const success = await onSave(userToSave);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving user:", error);
      // Toast is handled by the parent component
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
      // Toast is handled by the parent component
    }
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
      // For first passkey creation, validate email and phone
      if (!user.walletAddress) {
        // Recheck validation before proceeding
        if (!isEmailValid(user.email)) {
          toast({
            title: "Valid email required",
            description: "Please enter a valid email address before creating your account with passkey.",
            variant: "destructive",
          });
          return;
        }

        if (!isPhoneValid(user.phone || "")) {
          toast({
            title: "Valid phone number required",
            description: "Please enter a valid phone number before creating your account with passkey.",
            variant: "destructive",
          });
          return;
        }

        setIsAddingPasskey(true);

        // First, save the user information without wallet address
        const userToSave = { ...editedUser };
        delete userToSave.walletAddress; // Remove wallet to avoid validation issues

        toast({
          title: "Saving contact information...",
          description: "Updating your profile before creating your account",
        });

        try {
          // Save the user information first to ensure contact info is up to date
          await onSave(userToSave);
        } catch (updateError) {
          toast({
            title: "Error updating profile",
            description:
              updateError instanceof Error
                ? updateError.message
                : "Failed to update your profile information. Please try again.",
            variant: "destructive",
          });
          setIsAddingPasskey(false);
          return;
        }

        toast({
          title: "Creating account...",
          description: "Setting up your account with passkey authentication",
        });

        // Deploy a new individual account with recovery
        const { address: newWalletAddress, credentials } = await deployIndividualSafe({
          email: user.email,
          phone: user.phone || "",
          callbacks: {
            onPasskeyCreated: () => {
              toast({
                title: "Passkey created...",
                description: "Your secure passkey has been created",
              });
            },
            onDeployment: () => {
              toast({
                title: "Deploying account...",
                description: "Your account is being created on the blockchain",
              });
            },
            onRecoverySetup: () => {
              toast({
                title: "Setting up recovery...",
                description: "Configuring recovery options for your account",
              });
            },
            onError: (error: Error) => {
              toast({
                title: "Error creating account",
                description: error.message,
                variant: "destructive",
              });
            },
          },
        });

        // Optimistically update the UI with the new wallet address and passkey
        const newPasskey = {
          credentialId: credentials.credentialId,
          publicKey: PublicKey.toHex({ ...credentials.publicKey, prefix: 4 }),
          displayName: "My Passkey",
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          counter: 0,
        };

        setEditedUser((prev) => ({
          ...prev,
          walletAddress: newWalletAddress,
          registeredPasskeys: [...(prev.registeredPasskeys || []), newPasskey],
        }));

        toast({
          title: "Account created!",
          description: "Your account has been successfully created with passkey authentication",
        });

        // Now save the user with the wallet address
        await handleSave();
      } else {
        // Scenario 2: User has an existing individual account
        // Get all available credentials
        const availableCredentials = getCredentials();

        // Find a valid credential for signing (one that's active on-chain)
        const validCredential = availableCredentials?.find((cred) => {
          const matchingPasskey = passkeysWithStatus.find(
            (p) => p.credentialId === cred.credentialId && p.status === PasskeyStatus.ACTIVE_ONCHAIN
          );
          return Boolean(matchingPasskey);
        });

        if (!validCredential) {
          // No valid on-chain credentials found - give more detailed error
          toast({
            title: "Cannot add passkey",
            description:
              "You need an active on-chain passkey to authorize adding new ones. If your existing passkey shows as 'Pending', activate it first by clicking the 'Activate' button next to it.",
            variant: "destructive",
          });
          setIsAddingPasskey(false);
          return;
        }

        toast({
          title: "Preparing to add passkey...",
          description: "You'll need to authorize with your existing passkey",
        });

        // Set flag to skip the next passkey sync to prevent losing our optimistic update
        setSkipNextSync(true);

        // Define the result type to match what WebAuthnHelper.createPasskey returns
        let result:
          | {
              credentialId: string;
              publicKey: string;
              publicKeyCoordinates?: { x: bigint; y: bigint };
            }
          | undefined;

        try {
          result = await addPasskeyToSafe({
            safeAddress: user.walletAddress as Address,
            userEmail: user.email,
            credential: {
              publicKey: validCredential.publicKey,
              credentialId: validCredential.credentialId,
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

                // Since the transaction can take time to be confirmed on-chain,
                // let's mark this passkey as pending for now in the UI
                if (result && result.credentialId) {
                  setPasskeysWithStatus((prevPasskeys) => {
                    return prevPasskeys.map((p) =>
                      p.credentialId === result!.credentialId ? { ...p, status: PasskeyStatus.PENDING_ONCHAIN } : p
                    );
                  });
                }

                // Automatically save changes to the backend after successful passkey addition
                setTimeout(async () => {
                  await handleSave();
                }, 500); // Small delay to ensure UI updates are complete
              },
              onError: (error: Error) => {
                toast({
                  title: "Error adding passkey",
                  description: error.message,
                  variant: "destructive",
                });

                // On error, remove the optimistic update if result exists
                if (result && result.credentialId) {
                  setEditedUser((prev) => ({
                    ...prev,
                    registeredPasskeys:
                      prev.registeredPasskeys?.filter((p) => p.credentialId !== result!.credentialId) || [],
                  }));
                }
              },
            },
          });
        } catch (cancelError) {
          // Handle passkey creation cancellation
          console.log("Passkey creation was canceled:", cancelError);
          toast({
            title: "Passkey creation canceled",
            description: "You canceled the passkey creation process",
            variant: "default",
          });

          // Reset states to avoid inconsistent UI
          setSkipNextSync(false);
          setIsAddingPasskey(false);
          return;
        }

        // Only proceed with UI updates if we have a result (not canceled)
        if (result && result.credentialId) {
          // Optimistically update the UI with the new passkey
          const newPasskey = {
            credentialId: result.credentialId,
            publicKey: result.publicKeyCoordinates
              ? PublicKey.toHex({ ...result.publicKeyCoordinates, prefix: 4 })
              : result.publicKey, // Fallback to the string version
            displayName: "New Passkey",
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            counter: 0,
          };

          setEditedUser((prev) => ({
            ...prev,
            registeredPasskeys: [...(prev.registeredPasskeys || []), newPasskey],
          }));
        }
      }

      // DON'T immediately resync right after adding - let the UI show the optimistic update
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

  // Helper to add a pending passkey to the blockchain
  const handleActivatePasskey = async (passkey: PasskeyWithStatus) => {
    if (passkey.status !== PasskeyStatus.PENDING_ONCHAIN || !editedUser.walletAddress) {
      return;
    }

    try {
      // Get all available credentials
      const availableCredentials = getCredentials();

      // Find a valid credential for signing (one that's active on-chain)
      const validCredential = availableCredentials?.find((cred) => {
        const matchingPasskey = passkeysWithStatus.find(
          (p) => p.credentialId === cred.credentialId && p.status === PasskeyStatus.ACTIVE_ONCHAIN
        );
        return Boolean(matchingPasskey);
      });

      if (!validCredential) {
        toast({
          title: "Authorization required",
          description: "You need an active on-chain passkey to complete this operation",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Activating passkey...",
        description: "Adding your passkey to the blockchain. You'll need to authorize with your existing passkey.",
      });

      const result = await addPasskeyToSafe({
        safeAddress: editedUser.walletAddress as Address,
        userEmail: editedUser.email,
        credential: {
          publicKey: validCredential.publicKey,
          credentialId: validCredential.credentialId,
        },
        callbacks: {
          onSuccess: () => {
            toast({
              title: "Passkey activated!",
              description: "Your passkey is now registered on the blockchain and ready to use",
            });

            // Update the status in the UI
            setPasskeysWithStatus((prev) =>
              prev.map((p) =>
                p.credentialId === passkey.credentialId ? { ...p, status: PasskeyStatus.ACTIVE_ONCHAIN } : p
              )
            );
          },
          onError: (error) => {
            toast({
              title: "Error activating passkey",
              description: error.message,
              variant: "destructive",
            });
          },
        },
      });
    } catch (error) {
      console.error("Error activating passkey:", error);
      toast({
        title: "Error activating passkey",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Render status badge for passkey
  const renderPasskeyStatus = (status: PasskeyStatus) => {
    switch (status) {
      case PasskeyStatus.ACTIVE_ONCHAIN:
        return (
          <Chip
            startContent={<CheckCircle className="w-3 h-3" />}
            color="success"
            size="sm"
            variant="flat"
            classNames={{
              base: "h-6 px-2",
              content: "text-xs font-medium px-1",
            }}
          >
            Active
          </Chip>
        );
      case PasskeyStatus.PENDING_ONCHAIN:
        return (
          <Chip
            startContent={<Clock className="w-3 h-3" />}
            color="warning"
            size="sm"
            variant="flat"
            classNames={{
              base: "h-6 px-2",
              content: "text-xs font-medium px-1",
            }}
          >
            Pending
          </Chip>
        );
      default:
        return (
          <Chip
            startContent={<AlertCircle className="w-3 h-3" />}
            color="default"
            size="sm"
            variant="flat"
            classNames={{
              base: "h-6 px-2",
              content: "text-xs font-medium px-1",
            }}
          >
            Unknown
          </Chip>
        );
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
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground/70">Security & Passkeys</h3>
                  {editedUser.walletAddress && (
                    <Tooltip content="You can register multiple passkeys across devices for convenience and backup security">
                      <Info className="w-3.5 h-3.5 text-primary cursor-help" />
                    </Tooltip>
                  )}
                </div>
                {isSelf && (
                  <div>
                    <Button
                      className="bg-primary/10 text-primary"
                      endContent={<Plus className="w-4 h-4" />}
                      isLoading={isAddingPasskey}
                      isDisabled={!isValidForPasskey}
                      size="sm"
                      variant="flat"
                      onPress={handleAddPasskey}
                    >
                      {!user.walletAddress ? "Create Account" : "Add Passkey"}
                    </Button>
                    {!isValidForPasskey && !hasActiveOnchainPasskey && (
                      <p className="text-xs text-danger mt-1">Valid email and phone required</p>
                    )}
                  </div>
                )}
              </div>

              {(!isEmailValid(editedUser.email) || !isPhoneValid(editedUser.phone || "")) &&
                !user.walletAddress &&
                !hasActiveOnchainPasskey && (
                  <div className="p-3 rounded-lg bg-warning/10 mb-2">
                    <p className="text-sm text-warning-600 font-medium">Important Requirements</p>
                    <p className="text-xs mt-1">
                      A valid email address and phone number are required to set up your account with social recovery.
                      These will be used to help you recover your account if you lose access.
                    </p>
                    <ul className="text-xs list-disc list-inside mt-2">
                      {!isEmailValid(editedUser.email) && (
                        <li className="text-danger">Please provide a valid email address</li>
                      )}
                      {!isPhoneValid(editedUser.phone || "") && (
                        <li className="text-danger">Please provide a valid phone number</li>
                      )}
                    </ul>
                  </div>
                )}

              <ScrollShadow className="max-h-[200px]">
                <div className="space-y-2">
                  {passkeysWithStatus.length > 0 ? (
                    passkeysWithStatus.map((passkey) => (
                      <div
                        key={passkey.credentialId}
                        className="flex items-start justify-between p-3 rounded-lg bg-content2 hover:bg-content3 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0 mt-1">
                            <Fingerprint className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1">
                              <Input
                                classNames={{
                                  base: "w-full max-w-[calc(100%-8px)]",
                                  input: "text-sm font-medium",
                                  inputWrapper:
                                    "border-transparent bg-transparent hover:bg-content3/50 data-[hover=true]:bg-content3/50 group-data-[focus=true]:bg-content3/50 min-h-unit-8 h-8 shadow-none",
                                  innerWrapper: "h-8",
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

                              {/* Status and action row */}
                              <div className="flex items-center gap-2 ml-1">
                                {renderPasskeyStatus(passkey.status)}
                                {passkey.status === PasskeyStatus.PENDING_ONCHAIN && isSelf && (
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    className="h-6 text-xs px-3"
                                    startContent={<CheckCircle className="w-3 h-3" />}
                                    onPress={() => handleActivatePasskey(passkey)}
                                  >
                                    Activate
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center ml-2 mt-1">
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

              {/* Information about passkey sync */}
              {passkeysWithStatus.some((p) => p.status === PasskeyStatus.PENDING_ONCHAIN) && (
                <div className="p-3 rounded-lg bg-info/10 mt-2">
                  <p className="text-sm text-warning-600 font-medium">About Pending Passkeys</p>
                  <p className="text-xs mt-1">
                    Pending passkeys are stored securely but not yet activated on the blockchain. To use them for
                    signing transactions, you&apos;ll need to activate them first using an existing
                    blockchain-registered passkey.
                  </p>
                </div>
              )}

              {/* Simple explanation about using multiple passkeys */}
              <div className="p-3 rounded-lg bg-primary/5 mt-2">
                <p className="text-sm text-foreground font-medium">Why Use Multiple Passkeys?</p>
                <p className="text-xs mt-1">
                  Adding more than one passkey to your account makes it safer and easier to use. To add a new passkey,
                  you need to confirm it with one you already have.
                </p>
                <ul className="text-xs list-disc list-inside mt-2">
                  <li>Set up passkeys for different gadgets like your phone or laptop.</li>
                  <li>Have extra passkeys ready in case you can&apos;t use one of your devices.</li>
                </ul>
              </div>
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

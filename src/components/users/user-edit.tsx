import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { User } from "@heroui/user";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Fingerprint, Plus, Trash2, Info, Clock } from "lucide-react";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Tooltip } from "@heroui/tooltip";
import { Address, Hex } from "viem";
import { PublicKey } from "ox";
import { SafeAccountV0_3_0 as SafeAccount } from "abstractionkit";

import { formatPhoneNumber, formatStringToTitleCase, getFullName, getOpepenAvatar, getTimeAgo } from "@/utils/helpers";
import { PasskeyStatus, syncPasskeysWithSafe, PasskeyWithStatus } from "@/utils/safe/features/passkey";
import { WebAuthnHelper } from "@/utils/webauthn";
import { createAddOwnerTemplate } from "@/utils/safe/templates";
import { executeDirectTransaction } from "@/utils/safe/flows/direct";
import { deployIndividualSafe } from "@/utils/safe/features/deploy";
import { useToast } from "@/hooks/generics/useToast";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";
import PasskeyStatusComponent from "./passkey-status";
import pylon from "@/libs/pylon-sdk";
import { randomUUID } from "crypto";

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

// Component for a single passkey item
const PasskeyItem = ({
  passkey,
  isSelf,
  onRename,
  onActivate,
  renamingPasskeyId,
}: {
  passkey: PasskeyWithStatus;
  isSelf: boolean;
  onRename: (id: string, name: string) => void;
  onActivate: (passkey: PasskeyWithStatus) => void;
  renamingPasskeyId: string | null;
}) => {
  const [localDisplayName, setLocalDisplayName] = useState(passkey.displayName || "");

  const handleRename = () => {
    if (localDisplayName !== passkey.displayName) {
      onRename(passkey.credentialId, localDisplayName);
    }
  };

  // Update local state when passkey display name changes from parent
  useEffect(() => {
    setLocalDisplayName(passkey.displayName || "");
  }, [passkey.displayName]);

  return (
    <div
      key={passkey.credentialId}
      className="flex items-center gap-3 p-3 rounded-lg bg-content2 hover:bg-content3 transition-colors group relative"
    >
      {/* Left section - Icon and main info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Fingerprint className="w-4 h-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Input
              classNames={{
                base: "w-full max-w-[240px]",
                input: "text-sm font-medium",
                inputWrapper:
                  "border-transparent bg-transparent hover:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent min-h-unit-6 h-6 px-0 shadow-none",
                innerWrapper: "h-6",
              }}
              isDisabled={!isSelf || renamingPasskeyId === passkey.credentialId}
              placeholder="Unnamed Device"
              size="sm"
              value={localDisplayName}
              variant="flat"
              onBlur={handleRename}
              onChange={(e) => setLocalDisplayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
            />
            <PasskeyStatusComponent passkey={passkey} isSelf={isSelf} onActivate={onActivate} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1.5 text-xs text-foreground/50">
              <Clock className="w-3 h-3" />
              <span>Last used: {getTimeAgo(passkey.lastUsedAt)}</span>
            </div>
            {passkey.createdAt && (
              <>
                <div className="w-1 h-1 rounded-full bg-foreground/20" />
                <div className="text-xs text-foreground/50">Created {getTimeAgo(passkey.createdAt)}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        {isSelf && (
          <Tooltip content="Remove passkey (Coming soon)">
            <Button
              isDisabled
              isIconOnly
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
              size="sm"
              variant="light"
            >
              <Trash2 className="w-4 h-4 text-danger/70" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

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
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);
  const [passkeysWithStatus, setPasskeysWithStatus] = useState<PasskeyWithStatus[]>([]);
  const [skipNextSync, setSkipNextSync] = useState(false);
  const [renamingPasskeyId, setRenamingPasskeyId] = useState<string | null>(null);
  const [pendingPasskeyUpdates, setPendingPasskeyUpdates] = useState<Record<string, string>>({});

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

  // Check if there's at least one active passkey on-chain
  const hasActiveOnchainPasskey = passkeysWithStatus.some((p) => p.status === PasskeyStatus.ACTIVE_ONCHAIN);

  // Only require email/phone validation for first passkey or if no active passkeys exist
  const isValidForPasskey =
    hasActiveOnchainPasskey || (isEmailValid(editedUser.email) && isPhoneValid(editedUser.phone || ""));

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
    if (numbers.length !== 10) return formatPhoneNumber(phone);
    const areaCode = numbers.slice(0, 3);
    const lastFour = numbers.slice(-4);
    return `(${areaCode}) •••-${lastFour}`;
  };

  // Sync passkeys when the modal opens or when user data changes
  useEffect(() => {
    if (!isOpen || isAddingPasskey || skipNextSync) {
      if (skipNextSync) setSkipNextSync(false);
      return;
    }

    const syncPasskeys = async () => {
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
      }
    };

    syncPasskeys();
  }, [isOpen, editedUser.walletAddress, editedUser.registeredPasskeys, skipNextSync, isAddingPasskey]);

  // Event handlers
  const handleSave = async () => {
    try {
      // Create a copy of the edited user to avoid modifying the original
      const userToSave = { ...editedUser };

      // If walletAddress is null/undefined/empty, remove it to avoid schema validation issues
      if (!userToSave.walletAddress) {
        delete userToSave.walletAddress;
      }

      // First save the user data
      const success = await onSave(userToSave);
      if (!success) return;

      // Then update any pending passkey names
      const pendingUpdates = Object.entries(pendingPasskeyUpdates);
      if (pendingUpdates.length > 0) {
        try {
          // Find the passkeys that need updating
          for (const [credentialId, displayName] of pendingUpdates) {
            const passkey = editedUser.registeredPasskeys?.find((p) => p.credentialId === credentialId);
            if (passkey?.id) {
              await pylon.updatePasskeyDisplayName(passkey.id, { displayName });
            }
          }

          // Clear pending updates after successful save
          setPendingPasskeyUpdates({});
        } catch (error) {
          console.error("Error updating passkey names:", error);
          toast({
            title: "Partial update",
            description: "User information saved, but some passkey names could not be updated",
            variant: "destructive",
          });
          return;
        }
      }

      onClose();
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

  const handlePasskeyRename = (credentialId: string, displayName: string) => {
    // Store the pending update
    setPendingPasskeyUpdates((prev) => ({
      ...prev,
      [credentialId]: displayName,
    }));

    // Update the local UI state
    const updatedPasskeys = editedUser.registeredPasskeys?.map((p) =>
      p.credentialId === credentialId ? { ...p, displayName } : p
    );

    setEditedUser((prev) => ({
      ...prev,
      registeredPasskeys: updatedPasskeys,
    }));
  };

  // Create first passkey and account
  const handleCreateFirstPasskey = async () => {
    // Validate email and phone
    if (!isEmailValid(user.email)) {
      toast({
        title: "Valid email required",
        description: "Please enter a valid email address before creating your account with passkey.",
        variant: "destructive",
      });
      return false;
    }

    if (!isPhoneValid(user.phone || "")) {
      toast({
        title: "Valid phone number required",
        description: "Please enter a valid phone number before creating your account with passkey.",
        variant: "destructive",
      });
      return false;
    }

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
      return false;
    }

    toast({
      title: "Creating account...",
      description: "Setting up your account with passkey authentication",
    });

    try {
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
        id: randomUUID(), // TODO
        credentialId: credentials.credentialId,
        publicKey: PublicKey.toHex({ ...credentials.publicKey, prefix: 4 }),
        displayName: "Unnamed Device",
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
      return true;
    } catch (error) {
      console.error("Error creating first passkey:", error);
      toast({
        title: "Error creating account",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add additional passkey to existing account
  const handleAddAdditionalPasskey = async () => {
    let selectedCredential;

    try {
      // This will automatically use localStorage or show the modal if needed
      selectedCredential = await selectCredential();

      toast({
        title: "Preparing to add passkey...",
        description: "You'll need to authorize with your existing passkey",
      });

      // Skip the next passkey sync to prevent losing our optimistic update
      setSkipNextSync(true);

      try {
        // Create the new passkey for the user to add
        const result = await WebAuthnHelper.createPasskey(user.email);

        if (!result?.credentialId || !result?.publicKey || !result?.publicKeyCoordinates) {
          throw new Error("Failed to create passkey");
        }

        // Get the current Safe account
        const safeAccount = new SafeAccount(user.walletAddress as Address);

        // Create transaction to add the new signer while keeping the same threshold
        const addOwnerTxs = await createAddOwnerTemplate(safeAccount, result.publicKeyCoordinates, 1);

        toast({
          title: "Adding passkey...",
          description: "Please wait while we add your passkey to your account",
        });

        // Execute the transaction
        await executeDirectTransaction({
          safeAddress: user.walletAddress as Address,
          transactions: addOwnerTxs,
          credentials: selectedCredential,
          callbacks: {
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
                    p.credentialId === result.credentialId ? { ...p, status: PasskeyStatus.PENDING_ONCHAIN } : p
                  );
                });
              }

              // Automatically save changes to the backend after successful passkey addition
              setTimeout(handleSave, 500); // Small delay to ensure UI updates are complete
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
                    prev.registeredPasskeys?.filter((p) => p.credentialId !== result.credentialId) || [],
                }));
              }
            },
          },
        });

        // Only proceed with UI updates if we have a result
        if (result && result.credentialId) {
          // Optimistically update the UI with the new passkey
          const newPasskey = {
            id: result.passkeyId,
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

        return true;
      } catch (cancelError) {
        // Handle passkey creation cancellation
        console.log("Passkey creation was canceled:", cancelError);
        toast({
          title: "Passkey creation canceled",
          description: "You canceled the passkey creation process",
          variant: "default",
        });
        return false;
      }
    } catch (error: unknown) {
      // Handle credential selection error
      console.error("Failed to select credential:", error);
      toast({
        title: "Credential selection failed",
        description: error instanceof Error ? error.message : "Could not select a credential to sign with",
        variant: "destructive",
      });
      return false;
    }
  };

  // Main handler for adding passkeys - differentiates between first and additional passkeys
  const handleAddPasskey = async () => {
    setIsAddingPasskey(true);

    try {
      // Determine if this is the first passkey or an additional one
      if (!user.walletAddress) {
        await handleCreateFirstPasskey();
      } else {
        await handleAddAdditionalPasskey();
      }
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

  // Activate a pending passkey
  const handleActivatePasskey = async (passkey: PasskeyWithStatus) => {
    if (passkey.status !== PasskeyStatus.PENDING_ONCHAIN || !editedUser.walletAddress || !passkey.publicKey) {
      return;
    }

    try {
      // Use selectCredential to get a valid credential for signing
      let selectedCredential;
      try {
        selectedCredential = await selectCredential();

        toast({
          title: "Activating passkey...",
          description: "Adding your passkey to the blockchain. You'll need to authorize with your existing passkey.",
        });

        // Get the public key coordinates from the existing passkey
        const { x, y } = PublicKey.fromHex(passkey.publicKey as Hex);

        // Create the transaction to add the existing passkey as an owner
        const safeAccount = new SafeAccount(editedUser.walletAddress as Address);
        const addOwnerTx = await createAddOwnerTemplate(safeAccount, { x, y }, 1);

        // Execute the transaction with the selected credential for signing
        await executeDirectTransaction({
          safeAddress: editedUser.walletAddress as Address,
          transactions: addOwnerTx,
          credentials: selectedCredential,
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
            onError: (error: Error) => {
              toast({
                title: "Error activating passkey",
                description: error.message,
                variant: "destructive",
              });
            },
          },
        });
      } catch (error: unknown) {
        // Handle credential selection error
        console.error("Failed to select credential:", error);
        toast({
          title: "Credential selection failed",
          description: error instanceof Error ? error.message : "Could not select a credential to sign with",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Error activating passkey:", error);
      toast({
        title: "Error activating passkey",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // UI Components
  const renderPasskeyRequirements = () => {
    if (
      (!isEmailValid(editedUser.email) || !isPhoneValid(editedUser.phone || "")) &&
      !user.walletAddress &&
      !hasActiveOnchainPasskey
    ) {
      return (
        <div className="p-3 rounded-lg bg-warning/10 mb-2">
          <p className="text-sm text-warning-600 font-medium">Important Requirements</p>
          <p className="text-xs mt-1">
            A valid email address and phone number are required to set up your account with social recovery. These will
            be used to help you recover your account if you lose access.
          </p>
          <ul className="text-xs list-disc list-inside mt-2">
            {!isEmailValid(editedUser.email) && <li className="text-danger">Please provide a valid email address</li>}
            {!isPhoneValid(editedUser.phone || "") && (
              <li className="text-danger">Please provide a valid phone number</li>
            )}
          </ul>
        </div>
      );
    }
    return null;
  };

  const renderPasskeysList = () => (
    <ScrollShadow className="max-h-[200px]">
      <div className="space-y-2">
        {passkeysWithStatus.length > 0 ? (
          passkeysWithStatus.map((passkey) => (
            <PasskeyItem
              key={passkey.credentialId}
              passkey={passkey}
              isSelf={isSelf}
              onRename={handlePasskeyRename}
              onActivate={handleActivatePasskey}
              renamingPasskeyId={renamingPasskeyId}
            />
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
  );

  const renderPasskeyInfoText = () => {
    // Show pending passkeys info if needed
    if (passkeysWithStatus.some((p) => p.status === PasskeyStatus.PENDING_ONCHAIN)) {
      return (
        <div className="p-3 rounded-lg bg-info/10 mt-2">
          <p className="text-sm text-warning-600 font-medium">About Pending Passkeys</p>
          <p className="text-xs mt-1">
            Pending passkeys are stored securely but not yet activated on the blockchain. To use them for signing
            transactions, you&apos;ll need to activate them first using an existing blockchain-registered passkey.
          </p>
        </div>
      );
    }

    return (
      <div className="p-3 rounded-lg bg-primary/5 mt-2">
        <p className="text-sm text-foreground font-medium">Why Use Multiple Passkeys?</p>
        <p className="text-xs mt-1">
          Adding more than one passkey to your account makes it safer and easier to use. To add a new passkey, you need
          to confirm it with one you already have.
        </p>
        <ul className="text-xs list-disc list-inside mt-2">
          <li>Set up passkeys for different gadgets like your phone or laptop.</li>
          <li>Have extra passkeys ready in case you can&apos;t use one of your devices.</li>
        </ul>
      </div>
    );
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
                          <EyeOff className="w-4 h-4 text-default-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-default-400" />
                        )}
                      </Button>
                    }
                    isDisabled={!isEditable}
                    label="Email"
                    placeholder="Enter email address"
                    type="email"
                    value={!showEmail ? editedUser.email : maskEmail(editedUser.email)}
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
                          <EyeOff className="w-4 h-4 text-default-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-default-400" />
                        )}
                      </Button>
                    }
                    isDisabled={!isEditable}
                    label="Phone"
                    placeholder="Enter phone number"
                    value={
                      !showPhone
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
                    <SelectItem key={role} textValue={formatStringToTitleCase(role)}>
                      {formatStringToTitleCase(role)}
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

                {renderPasskeyRequirements()}
                {renderPasskeysList()}
                {renderPasskeyInfoText()}
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

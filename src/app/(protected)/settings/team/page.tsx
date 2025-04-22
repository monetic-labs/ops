"use client";

import { useState } from "react";
import { Chip } from "@heroui/chip";
import { User as HeroUser } from "@heroui/user"; // Renamed User import
import { MerchantUserGetOutput, MerchantUserCreateInput } from "@monetic-labs/sdk";
import { Tooltip } from "@heroui/tooltip";
import { Fingerprint, Eye, PlusIcon } from "lucide-react";

// Adjusted paths for moved location
import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { formatPhoneNumber, formatStringToTitleCase, getFullName, getOpepenAvatar } from "@/utils/helpers";
import { usersStatusColorMap } from "@/data";
import { useUsers } from "@/contexts/UsersContext";
import { useSigners } from "@/contexts/SignersContext";
import { useToast } from "@/hooks/generics/useToast";
import { useUser } from "@/contexts/UserContext"; // Import useUser to get logged-in user ID
import { Button } from "@heroui/button";

// Adjusted paths for modals
import CreateUserModal from "../_components/user-create";
import UserEditModal from "../_components/user-edit";

// Helper functions (maskEmail, maskPhone)
const maskEmail = (email: string) => {
  if (!email) return "N/A";
  const [username, domain] = email.split("@");
  if (!domain) return email;
  return `${username.slice(0, 3)}***@${domain}`;
};

const maskPhone = (phone: string) => {
  if (!phone) return "N/A";
  const numbers = phone.replace(/\D/g, "");
  if (numbers.length < 7) return formatPhoneNumber(phone); // Handle short numbers
  const areaCode = numbers.slice(0, 3);
  const lastFour = numbers.slice(-4);
  return `(${areaCode}) •••-${lastFour}`;
};

// Renamed component function
export default function TeamSettingsPage() {
  const { user: loggedInUser } = useUser(); // Get logged-in user
  const {
    users,
    isLoading: isLoadingUsers,
    error,
    isOwner,
    getAvailableRoles,
    createUser,
    updateUser,
    removeUser,
  } = useUsers();
  const { signers, isLoading: isLoadingSigners } = useSigners();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<MerchantUserGetOutput | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const availableRoles = getAvailableRoles();
  const isLoading = isLoadingUsers || isLoadingSigners;

  const memberColumns: Column<MerchantUserGetOutput>[] = [
    {
      name: "NAME",
      uid: "name",
      render: (user) => {
        const fullName = getFullName(user.firstName, user.lastName);
        const isSelf = user.id === loggedInUser?.id; // Check if it's the logged-in user

        return (
          <HeroUser
            avatarProps={{ radius: "lg", src: getOpepenAvatar(fullName, 32) }}
            classNames={{
              name: "truncate max-w-[200px] flex items-center gap-1", // Add flex and gap
              description: "truncate max-w-[200px]",
            }}
            description={user.username}
            name={
              <>
                {fullName}
                {isSelf && <span className="text-xs text-foreground/60">(You)</span>} {/* Add (You) indicator */}
              </>
            }
          />
        );
      },
    },
    {
      name: "ROLE",
      uid: "role",
      render: (user) => (
        <Chip
          color={usersStatusColorMap[user.role] || "default"}
          size="sm"
          variant="flat"
          className="capitalize truncate"
        >
          {formatStringToTitleCase(user.role)}
        </Chip>
      ),
    },
    {
      name: "SECURITY",
      uid: "security",
      render: (user) => {
        const passkeyCount = user.registeredPasskeys?.length || 0;
        const isAccountSigner = user.walletAddress && signers.some((signer) => signer.address === user.walletAddress);
        return (
          <div className="flex items-center gap-2">
            {passkeyCount > 0 ? (
              <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                <Fingerprint className="w-4 h-4" />
                {passkeyCount}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm text-foreground/50">
                <span>No security keys</span>
              </div>
            )}
            {isAccountSigner && (
              <Tooltip content="Account Signer">
                <Chip color="primary" size="sm" variant="flat">
                  Signer
                </Chip>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      name: "PHONE",
      uid: "phone",
      render: (user) => (
        <Tooltip content={user.phone ? formatPhoneNumber(user.phone) : "No phone number"} delay={500}>
          <span className="truncate block max-w-[150px] text-foreground/70">
            {user.phone ? maskPhone(user.phone) : <span className="text-foreground/40">N/A</span>}
          </span>
        </Tooltip>
      ),
    },
    {
      name: "EMAIL",
      uid: "email",
      render: (user) => (
        <Tooltip content={user.email || "No email"} delay={500}>
          <span className="truncate block max-w-[200px] text-foreground/70">
            {user.email ? maskEmail(user.email) : <span className="text-foreground/40">N/A</span>}
          </span>
        </Tooltip>
      ),
    },
  ];

  const handleUserClick = (user: MerchantUserGetOutput) => {
    if (!isOwner || user.id === loggedInUser?.id) {
      return;
    }
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // CRUD handlers remain the same
  const handleCreateUser = async (data: MerchantUserCreateInput) => {
    try {
      await createUser(data);
      setIsCreateModalOpen(false);
      toast({ title: "User created", description: "The new team member has been added successfully." });
    } catch (err) {
      console.error("Failed to create user:", err);
      toast({
        title: "Failed to create user",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (updatedUser: MerchantUserGetOutput) => {
    try {
      const success = await updateUser(updatedUser);
      if (success) {
        toast({ title: "User updated", description: "The user information has been updated successfully." });
        return true;
      } else {
        throw new Error("Failed to update user");
      }
    } catch (err) {
      console.error("Failed to update user:", err);
      toast({
        title: "Failed to update user",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const success = await removeUser(userId);
      if (success) {
        toast({ title: "User removed", description: "The user has been removed successfully." });
        return true;
      } else {
        throw new Error("Failed to remove user");
      }
    } catch (err) {
      console.error("Failed to remove user:", err);
      toast({
        title: "Failed to remove user",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    // Remove outer container? Settings layout provides padding.
    // <div className="space-y-8">
    <>
      <DataTable
        // Card-related props
        title="Team Members"
        subtitle="Manage your team members and their roles"
        actionButton={
          isOwner ? (
            <Button
              color="primary"
              variant="solid"
              onPress={() => setIsCreateModalOpen(true)}
              startContent={<PlusIcon className="w-4 h-4" />}
            >
              Add Member
            </Button>
          ) : undefined
        }
        // Standard DataTable props
        aria-label="Team members table"
        columns={memberColumns}
        items={users}
        isLoading={isLoading}
        isError={!!error}
        errorMessage="Failed to load members"
        emptyContent={
          isOwner ? (
            <EmptyContent message="Add your first member" type="primary" onAction={() => setIsCreateModalOpen(true)} />
          ) : (
            <EmptyContent message="No members found" />
          )
        }
        onRowAction={handleUserClick}
        selectionMode="none"
        isStriped={true}
        isHeaderSticky={true}
      />

      {/* Modals */}
      {selectedUser && (
        <UserEditModal
          availableRoles={availableRoles}
          isEditable={isOwner}
          isSelf={selectedUser.id === loggedInUser?.id}
          isOpen={isEditModalOpen}
          user={selectedUser}
          onClose={handleCloseEditModal}
          onRemove={handleRemoveUser}
          onSave={handleUpdateUser}
        />
      )}

      <CreateUserModal
        availableRoles={availableRoles}
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSave={handleCreateUser}
      />
    </>
    // </div>
  );
}

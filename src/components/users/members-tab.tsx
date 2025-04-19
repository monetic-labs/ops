"use client";

import { useState } from "react";
import { Chip } from "@heroui/chip";
import { User } from "@heroui/user";
import { MerchantUserGetOutput, MerchantUserCreateInput } from "@monetic-labs/sdk";
import { Tooltip } from "@heroui/tooltip";
import { Fingerprint, Eye } from "lucide-react";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { formatPhoneNumber, formatStringToTitleCase, getFullName, getOpepenAvatar } from "@/utils/helpers";
import { usersStatusColorMap } from "@/data";
import { useUsers } from "@/contexts/UsersContext";
import { useSigners } from "@/contexts/SignersContext";
import { useToast } from "@/hooks/generics/useToast";

import CreateUserModal from "./user-create";
import UserEditModal from "./user-edit";

// Helper function to mask email
const maskEmail = (email: string) => {
  if (!email) return "N/A";
  const [username, domain] = email.split("@");

  if (!domain) return email;

  return `${username.slice(0, 3)}***@${domain}`;
};

// Helper function to mask phone
const maskPhone = (phone: string) => {
  if (!phone) return "N/A";
  // Remove any non-numeric characters first
  const numbers = phone.replace(/\D/g, "");

  if (numbers.length !== 10) return formatPhoneNumber(phone); // If not a 10-digit number, just format it

  // Format the masked number
  const areaCode = numbers.slice(0, 3);
  const lastFour = numbers.slice(-4);

  return `(${areaCode}) •••-${lastFour}`;
};

interface MembersTabProps {
  userId: string;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;
}

export default function MembersTab({ userId, isCreateModalOpen, setIsCreateModalOpen }: MembersTabProps) {
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

  const availableRoles = getAvailableRoles();
  const isLoading = isLoadingUsers || isLoadingSigners;

  const memberColumns: Column<MerchantUserGetOutput>[] = [
    {
      name: "NAME",
      uid: "name",
      render: (user) => {
        const fullName = getFullName(user.firstName, user.lastName);

        return (
          <User
            avatarProps={{
              radius: "lg",
              src: getOpepenAvatar(fullName, 32),
            }}
            classNames={{
              name: "truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px]",
              description: "truncate max-w-[100px] sm:max-w-[200px] md:max-w-[300px]",
            }}
            description={user.username}
            name={fullName}
          >
            {fullName}
          </User>
        );
      },
    },
    {
      name: "ROLE",
      uid: "role",
      render: (user) => (
        <Chip
          className="capitalize truncate"
          color={usersStatusColorMap[user.role] || "default"}
          size="sm"
          variant="flat"
        >
          {formatStringToTitleCase(user.role)}
        </Chip>
      ),
    },
    {
      name: "SECURITY",
      uid: "security",
      render: (user) => {
        const hasPasskeys = user.registeredPasskeys && user.registeredPasskeys.length > 0;
        const isAccountSigner = user.walletAddress && signers.some((signer) => signer.address === user.walletAddress);

        return (
          <div className="flex items-center gap-2">
            {hasPasskeys ? (
              <Tooltip
                content={
                  <div className="p-2">
                    <p className="font-medium mb-2">
                      {user.registeredPasskeys.length} Passkey{user.registeredPasskeys.length > 1 ? "s" : ""}
                    </p>
                    <ul className="space-y-1">
                      {user.registeredPasskeys.map((key) => (
                        <li key={key.credentialId} className="text-sm text-foreground/70">
                          {key.displayName || "Unnamed Device"}
                        </li>
                      ))}
                    </ul>
                  </div>
                }
              >
                <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                  <Fingerprint className="w-4 h-4" />
                  {user.registeredPasskeys.length}
                </div>
              </Tooltip>
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
        <Tooltip
          content={
            <div className="py-2 px-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{user.phone ? formatPhoneNumber(user.phone) : "No phone number"}</span>
              </div>
            </div>
          }
          delay={500}
        >
          <span className="truncate block max-w-[150px] sm:max-w-[200px] text-foreground/70">
            {user.phone ? maskPhone(user.phone) : <span className="text-foreground/40">N/A</span>}
          </span>
        </Tooltip>
      ),
    },
    {
      name: "EMAIL",
      uid: "email",
      render: (user) => (
        <Tooltip
          content={
            <div className="py-2 px-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{user.email || "No email"}</span>
              </div>
            </div>
          }
          delay={500}
        >
          <span className="truncate block max-w-[150px] sm:max-w-[200px] md:max-w-[300px] text-foreground/70">
            {user.email ? maskEmail(user.email) : <span className="text-foreground/40">N/A</span>}
          </span>
        </Tooltip>
      ),
    },
  ];

  const handleUserClick = (user: MerchantUserGetOutput) => {
    if (!isOwner) return;
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCreateUser = async (data: MerchantUserCreateInput) => {
    try {
      await createUser(data);
      setIsCreateModalOpen(false);
      toast({
        title: "User created",
        description: "The new team member has been added successfully.",
      });
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
        toast({
          title: "User updated",
          description: "The user information has been updated successfully.",
        });
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
        toast({
          title: "User removed",
          description: "The user has been removed successfully.",
        });
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
    <div className="space-y-4">
      <DataTable
        aria-label="Members table"
        columns={memberColumns}
        emptyContent={
          isOwner ? (
            <EmptyContent message="Add your first member" onAction={() => setIsCreateModalOpen(true)} />
          ) : (
            <EmptyContent message="No members found" />
          )
        }
        errorMessage="Failed to load members"
        isError={!!error}
        isLoading={isLoading}
        items={users}
        selectionMode="none"
        onRowAction={handleUserClick}
      />

      {selectedUser && (
        <UserEditModal
          availableRoles={availableRoles}
          isEditable={isOwner}
          isOpen={isEditModalOpen}
          isSelf={selectedUser.id === userId}
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
    </div>
  );
}

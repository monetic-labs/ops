"use client";

import { useState } from "react";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { MerchantUserGetOutput, MerchantUserCreateInput, PersonRole } from "@backpack-fux/pylon-sdk";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { formatPhoneNumber, formatStringToTitleCase, getFullName, getOpepenAvatar } from "@/utils/helpers";
import { usersStatusColorMap } from "@/data";
import { useUsers } from "@/contexts/UsersContext";
import { useSigners } from "@/contexts/SignersContext";

import CreateUserModal from "./user-create";
import UserEditModal from "./user-edit";
import { ShieldCheck, Fingerprint, Info, Eye } from "lucide-react";

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
                <Chip size="sm" variant="flat" color="primary">
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
    } catch (err) {
      console.error("Failed to create user:", err);
      // TODO: Show error toast
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
          onRemove={removeUser}
          onSave={updateUser}
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

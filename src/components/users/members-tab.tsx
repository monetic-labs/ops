"use client";

import { useState } from "react";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { MerchantUserGetOutput, MerchantUserCreateInput } from "@backpack-fux/pylon-sdk";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { formatPhoneNumber, formatStringToTitleCase, getFullName, getOpepenAvatar } from "@/utils/helpers";
import { usersStatusColorMap } from "@/data";
import { useUsers } from "@/contexts/UsersContext";
import { useSigners } from "@/contexts/SignersContext";

import CreateUserModal from "./user-create";
import UserEditModal from "./user-edit";
import { ShieldCheck } from "lucide-react";

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
      name: "STATUS",
      uid: "status",
      render: (user) => {
        const isPending = user.pendingInvite?.isUsed === false;
        const isExpired = isPending && user.pendingInvite && new Date(user.pendingInvite.expiresAt) < new Date();

        return (
          <Chip
            className="capitalize"
            color={isPending ? (isExpired ? "danger" : "warning") : "success"}
            size="sm"
            variant="flat"
          >
            {isPending ? (isExpired ? "Invite Expired" : "Invite Pending") : "Active"}
          </Chip>
        );
      },
    },
    {
      name: "ROLE",
      uid: "role",
      render: (user) => {
        const isSigner =
          user.walletAddress && signers.some((s) => s.address.toLowerCase() === user.walletAddress?.toLowerCase());
        return (
          <Chip
            className="capitalize truncate"
            color={usersStatusColorMap[user.role] || "default"}
            size="sm"
            variant="flat"
          >
            <div className="flex items-center gap-1">
              {formatStringToTitleCase(user.role)}
              {isSigner && <ShieldCheck className="w-3 h-3" />}
            </div>
          </Chip>
        );
      },
    },
    {
      name: "PHONE",
      uid: "phone",
      render: (user) =>
        user.phone ? (
          <span className="truncate block max-w-[150px] sm:max-w-[200px]">{formatPhoneNumber(user.phone)}</span>
        ) : (
          <span className="truncate block text-default-400">N/A</span>
        ),
    },
    {
      name: "EMAIL",
      uid: "email",
      render: (user) => (
        <span className="truncate block max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">{user.email || "N/A"}</span>
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
          isEditable={isOwner && !selectedUser.pendingInvite}
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

"use client";

import { useState, useEffect } from "react";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { formatPhoneNumber, getFullName, getOpepenAvatar } from "@/utils/helpers";
import { usersStatusColorMap } from "@/data";
import pylon from "@/libs/pylon-sdk";
import { useAccounts } from "@/hooks/useAccounts";

import CreateUserModal from "./user-create";
import UserEditModal from "./user-edit";

interface MembersTabProps {
  userId: string;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;
}

export default function MembersTab({ userId, isCreateModalOpen, setIsCreateModalOpen }: MembersTabProps) {
  // All hooks must be at the top
  const { user } = useAccounts();
  const [users, setUsers] = useState<MerchantUserGetOutput[]>([]);
  const [selectedUser, setSelectedUser] = useState<MerchantUserGetOutput | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const fetchedUsers = await pylon.getUsers();

      setUsers(fetchedUsers);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (userId && user) {
      fetchUsers();
    }
  }, [userId, user]);

  if (!user) return null;

  const canManageUsers = user.role === PersonRole.SUPER_ADMIN;
  const isEditable = user.role === PersonRole.SUPER_ADMIN;

  const availableRoles = Object.values(PersonRole).filter((role) => {
    if (user.role === PersonRole.SUPER_ADMIN) return true;

    return false;
  });

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
      render: (user) => (
        <Chip
          className="capitalize truncate"
          color={usersStatusColorMap[user.role] || "default"}
          size="sm"
          variant="flat"
        >
          {user.role
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase())}
        </Chip>
      ),
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
    console.log("User clicked:", user);
    console.log("Can manage users:", canManageUsers);
    if (!canManageUsers) {
      console.log("Cannot manage users, returning");

      return;
    }
    setSelectedUser(user);
    setIsEditModalOpen(true);
    console.log("Edit modal should be open now");
  };

  const handleCreateUser = async (newUser: MerchantUserGetOutput) => {
    try {
      await fetchUsers();
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Error after creating user:", err);
      setError(err as Error);
    }
  };

  const handleUpdateUser = async (updatedUser: MerchantUserGetOutput) => {
    try {
      await pylon.updateUser(updatedUser.id, {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
      });

      // Update the local state instead of refetching
      setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      handleCloseEditModal();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err as Error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const userToRemove = users.find((u) => u.id === userId);

    if (!userToRemove) return;

    try {
      if (userToRemove.pendingInvite && !userToRemove.pendingInvite.isUsed) {
        // For pending invites, use cancelInvite with the invite ID
        const success = await pylon.cancelInvite(userToRemove.pendingInvite.id);

        if (!success) {
          throw new Error("Failed to cancel invite");
        }
      } else {
        // For active users, use deleteUser with the user ID
        const success = await pylon.deleteUser(userId);

        if (!success) {
          throw new Error("Failed to remove user");
        }
      }

      // Update the local state
      setUsers(users.filter((user) => user.id !== userId));
      handleCloseEditModal();
    } catch (err) {
      console.error("Error removing user:", err);
      setError(err as Error);
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
          canManageUsers ? (
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
          isEditable={isEditable && !selectedUser.pendingInvite}
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

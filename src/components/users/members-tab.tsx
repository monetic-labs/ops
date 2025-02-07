"use client";

import { useState, useEffect } from "react";
import { Chip } from "@nextui-org/chip";
import { User } from "@nextui-org/user";
import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
import { formatPhoneNumber, getFullName, getOpepenAvatar } from "@/utils/helpers";
import { usersStatusColorMap } from "@/data";
import pylon from "@/libs/pylon-sdk";

import CreateUserModal from "./user-create";
import UserEditModal from "./user-edit";

interface MembersTabProps {
  userId: string;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;
}

export default function MembersTab({ userId, isCreateModalOpen, setIsCreateModalOpen }: MembersTabProps) {
  const [users, setUsers] = useState<MerchantUserGetOutput[]>([]);
  const [selectedUser, setSelectedUser] = useState<MerchantUserGetOutput | null>(null);
  const [userRole, setUserRole] = useState<PersonRole | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debug logs
  console.log("Current userId:", userId);
  console.log("Current userRole:", userRole);
  console.log("Selected user:", selectedUser);
  console.log("Edit modal open:", isEditModalOpen);

  const canManageUsers = userRole === PersonRole.SUPER_ADMIN;
  const isEditable = userRole === PersonRole.SUPER_ADMIN;

  const availableRoles = Object.values(PersonRole).filter((role) => {
    if (userRole === PersonRole.SUPER_ADMIN) return true;
    return false;
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await pylon.getUsers();
      console.log("Fetched users:", fetchedUsers);
      setUsers(fetchedUsers);
      const currentUser = fetchedUsers.find((user) => user.id === userId);
      console.log("Current user found:", currentUser);
      setUserRole(currentUser?.role || null);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUsers();
    }
  }, [userId]);

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
    try {
      const success = await pylon.deleteUser(userId);
      if (success) {
        // Update the local state instead of refetching
        setUsers(users.filter((user) => user.id !== userId));
        handleCloseEditModal();
      } else {
        throw new Error("Failed to remove user");
      }
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
        onRowAction={handleUserClick}
        selectionMode="none"
      />

      {selectedUser && (
        <UserEditModal
          availableRoles={availableRoles}
          isEditable={isEditable}
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

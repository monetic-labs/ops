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

  const canManageUsers = userRole === PersonRole.ADMIN || userRole === PersonRole.SUPER_ADMIN;
  const isEditable =
    userRole === PersonRole.SUPER_ADMIN ||
    (userRole === PersonRole.ADMIN && selectedUser?.role !== PersonRole.SUPER_ADMIN);
  const availableRoles = Object.values(PersonRole).filter((role) => {
    if (userRole === PersonRole.SUPER_ADMIN) return true;
    if (userRole === PersonRole.ADMIN) return role !== PersonRole.SUPER_ADMIN;
    return role === PersonRole.MEMBER;
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const users = await pylon.getUsers();
        setUsers(users);
        setUserRole(users.find((user) => user.id === userId)?.role || null);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
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
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <DataTable
        aria-label="Members table"
        columns={memberColumns}
        emptyContent={<EmptyContent message="Add your first member" onAction={() => setIsCreateModalOpen(true)} />}
        errorMessage="Failed to load members"
        isError={!!error}
        isLoading={isLoading}
        items={users}
        onRowAction={handleUserClick}
      />

      {selectedUser && (
        <UserEditModal
          availableRoles={availableRoles}
          isEditable={isEditable}
          isOpen={isEditModalOpen && canManageUsers}
          isSelf={selectedUser.id === userId}
          user={selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setIsEditModalOpen(false);
          }}
          onRemove={async (userId) => {
            const success = await pylon.deleteUser(selectedUser.id);
            if (success) {
              setUsers(users.filter((user) => user.id !== selectedUser.id));
              setSelectedUser(null);
              setIsEditModalOpen(false);
            } else {
              alert("Failed to remove user");
            }
          }}
          onSave={async (updatedUser) => {
            const returnedUser = await pylon.updateUser(updatedUser.id, {
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              username: updatedUser.username,
              email: updatedUser.email,
              role: updatedUser.role,
              phone: updatedUser.phone,
            });
            setUsers(users.map((user) => (user.id === returnedUser.id ? returnedUser : user)));
            setSelectedUser(null);
            setIsEditModalOpen(false);
          }}
        />
      )}

      <CreateUserModal
        availableRoles={availableRoles}
        isOpen={isCreateModalOpen && canManageUsers}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(newUser) => {
          setUsers([...users, newUser]);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}

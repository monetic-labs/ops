import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { User } from "@nextui-org/user";
import React, { useCallback, useEffect, useState } from "react";

import { Column, usersColumns, usersStatusColorMap } from "@/data";
import CreateUserModal from "./user-create";
import UserEditModal from "./user-edit";
import { getFullName, getOpepenAvatar } from "@/utils/helpers";

import pylon from "@/libs/pylon-sdk";
import { MerchantUserGetOutput, PersonRole } from "@backpack-fux/pylon-sdk";

export default function UserTab({ userId }: { userId: string }) {
  const [users, setUsers] = useState<MerchantUserGetOutput[]>([]);
  const [selectedUser, setSelectedUser] = useState<MerchantUserGetOutput | null>(null);
  const [userRole, setUserRole] = useState<PersonRole | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const renderCell = useCallback((user: MerchantUserGetOutput, columnKey: keyof MerchantUserGetOutput) => {
    const cellValue = user[columnKey];
    const displayValue = cellValue || "N/A";
    const style = cellValue ? {} : { color: "rgba(128, 128, 128, 0.5)" };

    switch (columnKey) {
      case "firstName":
        const fullName = getFullName(user.firstName, user.lastName);
        return (
          <div className="flex items-center gap-2">
            <User
              avatarProps={{
                radius: "lg",
                src: getOpepenAvatar(fullName, 32),
              }}
              description={user.username}
              name={fullName}
            >
              {fullName}
            </User>
          </div>
        );
      case "role":
        return (
          <div className="flex items-center gap-2">
            <Chip className="capitalize" color={usersStatusColorMap[user.role] || "default"} size="sm" variant="flat">
              {user.role
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (char) => char.toUpperCase())}
            </Chip>
          </div>
        );
      default:
        return <span style={style}>{displayValue}</span>;
    }
  }, []);

  return (
    <>
      {canManageUsers && (
        <div className="flex justify-end items-center mb-4">
          <Button className="text-notpurple-500" onPress={() => setIsCreateModalOpen(true)}>
            Create User
          </Button>
        </div>
      )}
      <Table aria-label="Transactions table with custom cells">
        <TableHeader columns={usersColumns as Column<MerchantUserGetOutput>[]}>
          {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
        </TableHeader>
        <TableBody emptyContent={isLoading ? null : "No users found"} items={users}>
          {(item) => {
            return (
              <TableRow
                key={item.id}
                className={`transition-all hover:bg-gray-100 dark:hover:bg-charyo-500 ${
                  canManageUsers ? "hover:cursor-pointer" : "hover:cursor-default"
                }`}
                onClick={() => {
                  setSelectedUser(item);
                  setIsEditModalOpen(true);
                }}
              >
                {(columnKey) => <TableCell>{renderCell(item, columnKey as keyof MerchantUserGetOutput)}</TableCell>}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>

      {selectedUser && (
        <>
          <UserEditModal
            isOpen={isEditModalOpen && canManageUsers}
            user={selectedUser}
            availableRoles={availableRoles}
            isEditable={isEditable}
            isSelf={selectedUser.id === userId}
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
        </>
      )}
      <CreateUserModal
        isOpen={isCreateModalOpen && canManageUsers}
        availableRoles={availableRoles}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(newUser) => {
          setUsers([...users, newUser]);
          setIsCreateModalOpen(false);
        }}
      />
    </>
  );
}

import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { User } from "@nextui-org/user";
import React, { useCallback, useEffect, useState } from "react";

import { userData, usersColumns, usersStatusColorMap, User as CardUser, cardTransactionData } from "@/data";

import CreateUserModal from "./user-create";
import UserEditModal from "./user-edit";
import UserDetailsModal from "./users-details";
import { getOpepenAvatar } from "@/utils/helpers";
import InfiniteTable from "../generics/table-infinite";

export default function UserTab() {
  const [selectedUser, setSelectedUser] = useState<(typeof userData)[0] | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    const newAvatars: Record<string, string> = {};
    userData.forEach((user) => {
      newAvatars[user.id] = getOpepenAvatar(user.id, 32);
    });
    setAvatars(newAvatars);
  }, []);

  const renderCell = useCallback((user: CardUser, columnKey: keyof CardUser) => {
    const cellValue = user[columnKey];

    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{
              radius: "lg",
              src: avatars[user.id],
            }}
            description={user.name}
            name={cellValue}
          >
            {cellValue}
          </User>
        );
      case "status":
        return (
          <Chip className="capitalize" color={usersStatusColorMap[user.status]} size="sm" variant="flat">
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              className="bg-charyo-400 text-notpurple-500"
              size="sm"
              onPress={() => {
                setSelectedUser(user);
                setIsDetailsModalOpen(true);
              }}
            >
              Details
            </Button>
            <Button
              className="bg-charyo-400 text-notpurple-500"
              size="sm"
              onPress={() => {
                setSelectedUser(user);
                setIsEditModalOpen(true);
              }}
            >
              Edit
            </Button>
          </div>
        );
      default:
        return cellValue;
    }
  }, [avatars]);

  const loadMore = async (cursor: string | undefined) => {
    const pageSize = 10; 
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + pageSize;
    const newItems = userData.slice(startIndex, endIndex);
    const newCursor = endIndex < userData.length ? endIndex.toString() : undefined;
    
    return { items: newItems, cursor: newCursor };
  };

  return (
    <>
      <div className="flex justify-end items-center mb-4">
        <Button className="text-notpurple-500" onPress={() => setIsCreateModalOpen(true)}>
          Create User
        </Button>
      </div>
      <InfiniteTable
        columns={usersColumns}
        initialData={userData}
        renderCell={renderCell}
        loadMore={loadMore}
      />

      {selectedUser && (
        <>
          <UserDetailsModal
            isOpen={isDetailsModalOpen}
            user={selectedUser}
            onClose={() => setIsDetailsModalOpen(false)}
          />
          <UserEditModal
            isOpen={isEditModalOpen}
            user={selectedUser}
            onClose={() => setIsEditModalOpen(false)}
            onRemove={(userId) => {
              // Implement remove logic here
              console.log("Removing user:", userId);
              setIsEditModalOpen(false);
            }}
            onSave={(updatedUser) => {
              // Implement save logic here
              console.log("Saving user:", updatedUser);
              setIsEditModalOpen(false);
            }}
          />
        </>
      )}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(newUser) => {
          // Implement create user logic here
          console.log("Creating user:", newUser);
          setIsCreateModalOpen(false);
        }}
      />
    </>
  );
}

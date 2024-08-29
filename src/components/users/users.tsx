import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/table";
import { User } from "@nextui-org/user";
import React, { useState } from "react";

import { users, usersColumns } from "@/data";

import CreateUserModal from "./user-create";
import UserEditModal from "./user-edit";
import UserDetailsModal from "./users-details";

const statusColorMap: Record<string, "success" | "danger"> = {
  Active: "success",
  Inactive: "danger",
};

export default function UserTab() {
  const [selectedUser, setSelectedUser] = useState<(typeof users)[0] | null>(
    null,
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const renderCell = React.useCallback(
    (card: (typeof users)[0], columnKey: keyof (typeof users)[0]) => {
      const cellValue = card[columnKey];

      switch (columnKey) {
        case "name":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: `https://i.pravatar.cc/150?u=${card.name}`,
              }}
              description={card.name}
              name={cellValue}
            >
              {card.name}
            </User>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[card.status]}
              size="sm"
              variant="flat"
            >
              {cellValue}
            </Chip>
          );
        case "actions":
          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                onPress={() => {
                  setSelectedUser(card);
                  setIsDetailsModalOpen(true);
                }}
              >
                Details
              </Button>
              <Button
                size="sm"
                onPress={() => {
                  setSelectedUser(card);
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
    },
    [],
  );

  return (
    <>
      <div className="flex justify-end items-center mb-4">
        <Button color="default" onPress={() => setIsCreateModalOpen(true)}>
          Create User
        </Button>
      </div>
      <Table aria-label="Example table with custom cells">
        <TableHeader columns={usersColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={users}>
          {(item) => (
            <TableRow key={item.name}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(item, columnKey as keyof (typeof users)[0])}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

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

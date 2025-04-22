"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { PlusIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { DataTable, Column, EmptyContent } from "@/components/generics/data-table";
// TODO: Replace with actual API Key type and modal
// import GenerateApiKeysModal from "@/components/back-office/actions/widgets/api-keys";

// TODO: Replace with real type from SDK or define here
interface ApiKey {
  id: string;
  name: string;
  prefix: string; // Display prefix, not the full key
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
  status: "Active" | "Inactive" | "Revoked"; // Example statuses
}

// Mock data - replace with actual data fetching hook (e.g., useApiKeys)
const mockApiKeys: ApiKey[] = [
  {
    id: "key_1",
    name: "Production Key",
    prefix: "pk_live_abc...",
    createdAt: new Date(2024, 1, 1), // Feb 1, 2024
    lastUsedAt: new Date(2024, 1, 5), // Feb 5, 2024
    status: "Active",
  },
  {
    id: "key_2",
    name: "Development Key",
    prefix: "sk_test_xyz...",
    createdAt: new Date(2024, 0, 15), // Jan 15, 2024
    lastUsedAt: null,
    status: "Active",
  },
  {
    id: "key_3",
    name: "Old Staging Key",
    prefix: "sk_test_123...",
    createdAt: new Date(2023, 10, 1), // Nov 1, 2023
    lastUsedAt: new Date(2023, 11, 20), // Dec 20, 2023
    status: "Revoked",
  },
];

export default function ApiKeysPage() {
  // TODO: Replace useState with useApiKeys hook for data, loading, error, create, delete
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const columns: Column<ApiKey>[] = [
    {
      name: "NAME",
      uid: "name",
      render: (key) => <span className="font-medium">{key.name}</span>,
    },
    {
      name: "KEY PREFIX",
      uid: "prefix",
      render: (key) => <span className="font-mono text-xs text-foreground/70">{key.prefix}</span>,
    },
    {
      name: "CREATED",
      uid: "createdAt",
      render: (key) => (
        <span className="text-sm text-foreground/80">{format(new Date(key.createdAt), "MMM d, yyyy")}</span>
      ),
    },
    {
      name: "LAST USED",
      uid: "lastUsedAt",
      render: (key) => (
        <span className="text-sm text-foreground/80">
          {key.lastUsedAt ? format(new Date(key.lastUsedAt), "MMM d, yyyy") : "Never"}
        </span>
      ),
    },
    {
      name: "STATUS",
      uid: "status",
      // TODO: Add color coding based on status
      render: (key) => <span className="text-sm font-medium">{key.status}</span>,
    },
    {
      name: "ACTIONS",
      uid: "actions",
      render: (key) => {
        // TODO: Implement revoke/delete logic
        const handleRevoke = () => {
          console.log("Revoke key:", key.id);
          // Call delete function from hook/context
        };
        return (
          <div className="flex justify-end">
            {key.status !== "Revoked" && (
              <Button isIconOnly size="sm" variant="light" color="danger" onPress={handleRevoke}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const handleCreateKey = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    // TODO: Refetch keys after modal close if needed
  };

  // TODO: Implement actual create API key logic in the modal/hook
  const handleSaveNewKey = (/* newKeyData */) => {
    console.log("Save new key logic here");
    // Call create function from hook/context
    handleCloseCreateModal();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">API Keys</h2>
        <p className="text-sm text-foreground/70 mt-1">
          Manage your API keys below. Treat your keys like passwords and keep them secure.
        </p>
      </div>
      <DataTable
        aria-label="API Keys table"
        items={apiKeys}
        columns={columns}
        isLoading={isLoading}
        isError={!!error}
        errorMessage={error || "Failed to load API keys"}
        emptyContent={<EmptyContent message="No API keys created yet." type="primary" onAction={handleCreateKey} />}
        actionButton={
          <Button color="primary" onPress={handleCreateKey} startContent={<PlusIcon className="w-4 h-4" />}>
            Create API Key
          </Button>
        }
        selectionMode="none"
        isStriped={true}
        isHeaderSticky={true}
      />

      {/* TODO: Replace with the actual Create API Key modal */}
      {/* <GenerateApiKeysModal 
          isOpen={isCreateModalOpen} 
          onClose={handleCloseCreateModal} 
          onSave={handleSaveNewKey} // Pass a save handler 
      /> */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={handleCloseCreateModal}
        >
          <div className="bg-content1 p-6 rounded-lg shadow-lg w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-4">Create API Key (Placeholder)</h3>
            <p className="text-sm text-foreground/80 mb-4">Actual modal implementation needed.</p>
            <div className="flex justify-end gap-2">
              <Button variant="bordered" onPress={handleCloseCreateModal}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSaveNewKey}>
                Create (Placeholder)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

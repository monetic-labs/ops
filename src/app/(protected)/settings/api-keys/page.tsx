"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { TableColumn, TableCell, Table, TableBody, TableHeader, TableRow } from "@heroui/table";
import { Input } from "@heroui/input";
import { Snippet } from "@heroui/snippet";
import { Spinner } from "@heroui/spinner";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Trash2, PlusIcon } from "lucide-react";
import { useToast } from "@/hooks/generics/useToast";

// Assuming the hook exists and provides the necessary functions/state
import { useApiService } from "./_hooks/useApiService";
import { ApiKeyGetOutput } from "@monetic-labs/sdk";

// Helper to format date nicely
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

// Helper to truncate the key for display
const truncateKey = (key: string): string => {
  if (!key || key.length <= 10) return key || "";
  return `${key.slice(0, 5)}...${key.slice(-4)}`;
};

export default function ApiKeysSettingsPage() {
  const { apiKeys, isLoading, error, loadApiKeys, generateApiKey, deleteApiKey } = useApiService();
  const [newKeyName, setNewKeyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track which key is being deleted
  const { toast } = useToast();

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: "Error", description: "Please enter a name for the API key.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      await generateApiKey(newKeyName.trim());
      setNewKeyName(""); // Clear input on success
      toast({ title: "Success", description: `API Key "${newKeyName.trim()}" generated.` });
    } catch (err: any) {
      console.error("Failed to generate API key:", err);
      toast({
        title: "Error Generating Key",
        description: err.message || "Could not generate key.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteKey = async (keyId: string, keyName: string) => {
    // Basic confirmation, consider a more robust confirmation modal
    if (!window.confirm(`Are you sure you want to delete the key "${keyName}"? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(keyId);
    try {
      await deleteApiKey(keyId);
      toast({ title: "Success", description: `API Key "${keyName}" deleted.` });
    } catch (err: any) {
      console.error("Failed to delete API key:", err);
      toast({
        title: "Error Deleting Key",
        description: err.message || "Could not delete key.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">API Keys</h1>
      <p className="text-sm text-foreground-500">Manage API keys for accessing Monetic services.</p>

      <Card className="max-w-3xl">
        <CardHeader>
          <h2 className="text-lg font-medium">Generate New Key</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Enter key name (e.g., Production Server)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-grow"
              aria-label="New API Key Name"
            />
            <Button
              color="primary"
              onPress={handleGenerateKey}
              isLoading={isGenerating}
              isDisabled={isGenerating}
              startContent={!isGenerating ? <PlusIcon className="w-4 h-4" /> : null}
            >
              Generate Key
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Existing Keys</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto pt-0">
          {error && <p className="text-danger p-4">Error loading API keys: {error}</p>}
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner label="Loading keys..." />
            </div>
          ) : (
            <Table removeWrapper aria-label="API Keys Table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>KEY</TableColumn>
                <TableColumn>CREATED</TableColumn>
                <TableColumn>LAST USED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent={apiKeys.length === 0 ? "No API keys generated yet." : ""}>
                {apiKeys.map((key: ApiKeyGetOutput) => (
                  <TableRow key={key.key}>
                    <TableCell>{key.name || "N/A"}</TableCell>
                    <TableCell>
                      <Snippet
                        codeString={key.key}
                        size="sm"
                        variant="flat"
                        classNames={{ base: "bg-transparent p-0", copyButton: "text-foreground/60" }}
                      >
                        {truncateKey(key.key)}
                      </Snippet>
                    </TableCell>
                    <TableCell>{formatDate(key.createdAt)}</TableCell>
                    <TableCell>{formatDate(key.lastUsed)}</TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        variant="light"
                        color="danger"
                        size="sm"
                        onPress={() => handleDeleteKey(key.key, key.name || "Unnamed Key")}
                        isLoading={isDeleting === key.key}
                        isDisabled={isDeleting === key.key}
                        aria-label={`Delete key ${key.name || "Unnamed Key"}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

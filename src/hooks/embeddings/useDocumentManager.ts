import { useState } from "react";

/**
 * Options for deleting a single document
 */
interface DeleteOptions {
  id: string;
  namespace?: string;
}

/**
 * Options for deleting multiple documents
 */
interface DeleteManyOptions {
  ids?: string[];
  filter?: Record<string, any>;
  namespace?: string;
  deleteAll?: boolean;
}

/**
 * Custom hook for managing document operations in the embeddings system
 * Provides functionality for deleting single or multiple documents
 * @returns Object containing delete functions and state
 */
export function useDocumentManager() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Deletes a single document by ID
   * @param options - DeleteOptions containing document ID and optional namespace
   * @returns Promise resolving to the deletion result
   */
  const deleteDocument = async ({ id, namespace }: DeleteOptions) => {
    try {
      setDeleting(true);
      setError(null);

      const response = await fetch("/api/embeddings/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, namespace }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete document");
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete document";

      setError(message);
      throw error;
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Deletes multiple documents based on provided options
   * @param options - DeleteManyOptions for bulk deletion
   * @returns Promise resolving to the deletion result
   */
  const deleteManyDocuments = async (options: DeleteManyOptions) => {
    try {
      setDeleting(true);
      setError(null);

      const endpoint = options.deleteAll ? "/api/embeddings/delete-all" : "/api/embeddings/delete";
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete documents");
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete documents";

      setError(message);
      throw error;
    } finally {
      setDeleting(false);
    }
  };

  return {
    deleteDocument,
    deleteManyDocuments,
    deleting,
    error,
  };
}

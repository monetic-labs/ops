import { useState } from "react";

interface DeleteOptions {
  id: string;
  namespace?: string;
}

interface DeleteManyOptions {
  ids?: string[];
  filter?: Record<string, any>;
  namespace?: string;
  deleteAll?: boolean;
}

export function useDocumentManager() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

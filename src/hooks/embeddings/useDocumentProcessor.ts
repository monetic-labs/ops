import { useState } from "react";

export interface ProcessingStatus {
  type: "success" | "error" | null;
  message: string;
}

export interface ProcessingResult {
  document: {
    id: string;
    title: string;
    category: string;
    size: number;
    metadata: Record<string, any>;
  };
  indexStats: {
    totalDocuments: number;
    namespaces: Record<string, { recordCount: number }>;
  };
}

export function useDocumentProcessor() {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>({ type: null, message: "" });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processDocument = async (file: File, category?: string) => {
    try {
      setProcessing(true);
      setError(null);

      const formData = new FormData();

      formData.append("file", file);
      if (category) formData.append("category", category);

      const response = await fetch("/api/embeddings/upload-docs", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult(data);

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Processing failed";

      setError(message);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  return {
    processDocument,
    processing,
    status,
    result,
    error,
  };
}

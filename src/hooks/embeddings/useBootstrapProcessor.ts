import { useState } from "react";

interface BootstrapStats {
  totalDocuments: number;
  namespaces: Record<string, { recordCount: number }>;
  errors: string[];
}

export const useBootstrapProcessor = () => {
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    stats?: BootstrapStats;
  }>({ type: null, message: "" });

  const runBootstrap = async () => {
    setIsBootstrapping(true);
    setBootstrapStatus({ type: null, message: "Starting bootstrap..." });

    try {
      const response = await fetch("/api/embeddings/upload-bootstrap", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || "Bootstrap failed");
      }

      setBootstrapStatus({
        type: "success",
        message: `Successfully bootstrapped knowledge base with ${result.results.success} embeddings`,
        stats: result.stats,
      });

      // Trigger a refresh of the KB stats
      window.dispatchEvent(new CustomEvent("kb-stats-refresh"));
    } catch (error) {
      setBootstrapStatus({
        type: "error",
        message: `Bootstrap failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  return { runBootstrap, isBootstrapping, bootstrapStatus };
};

import { useState, useEffect } from 'react';

interface PineconeStats {
  totalDocuments: number;
  namespaces: Record<string, { vectorCount: number }>;
  dimension: number;
  indexFullness: number;
}

export function usePineconeStats() {
  const [stats, setStats] = useState<PineconeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/embeddings/stats');
      if (!response.ok) throw new Error('Failed to fetch Pinecone stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      console.error('Error fetching Pinecone stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refreshStats: fetchStats };
}
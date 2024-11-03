'use client';

import { useEffect, useState } from 'react';
import { Card } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Spinner } from '@nextui-org/spinner';

type IndexStats = {
  totalDocuments: number;
  dimension: number;
  namespaces: Record<string, { recordCount: number }>;
  indexFullness: number;
  refresh: () => Promise<void>;
}

const KnowledgeBaseStats = () => {
  const [stats, setStats] = useState<IndexStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/embeddings/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner size="sm" />
        <span className="ml-2">Loading stats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-ualert-500/20 rounded">
        <div className="text-ualert-500">{error}</div>
        <Button size="sm" color="primary" onClick={fetchStats} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return <div>No stats available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-charyo-700/60 p-4">
        <h3 className="text-sm font-semibold text-notpurple-500/60">Total Documents</h3>
        <p className="text-2xl font-bold text-notpurple-500">{stats.totalDocuments}</p>
      </Card>
      <Card className="bg-charyo-700/60 p-4">
        <h3 className="text-sm font-semibold text-notpurple-500/60">Vector Dimension</h3>
        <p className="text-2xl font-bold text-notpurple-500">{stats.dimension}</p>
      </Card>
      <Card className="bg-charyo-700/60 p-4">
        <h3 className="text-sm font-semibold text-notpurple-500/60">Index Fullness</h3>
        <p className="text-2xl font-bold text-notpurple-500">
          {(stats.indexFullness * 100).toFixed(2)}%
        </p>
      </Card>
      <Card className="bg-charyo-700/60 p-4">
        <h3 className="text-sm font-semibold text-notpurple-500/60">Namespaces</h3>
        <p className="text-2xl font-bold text-notpurple-500">
          {Object.keys(stats.namespaces).length}
        </p>
      </Card>
    </div>
  );
};

export default KnowledgeBaseStats;
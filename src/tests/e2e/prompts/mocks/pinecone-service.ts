import { validateEmbeddingMetadata } from "@/prompts/v0/functions/graph-validation";
import { createImmutableGraph } from "@/prompts/v0/functions/graph-validation";

import { mockPineconeConfig } from "../fixtures/pinecone-index.fixture";
import { mockNamespaceStats } from "../fixtures/pinecone-namespace.fixture";
import { mockGraph } from "../fixtures/graph.fixture";

export class MockPineconeIndex {
  private vectors: Map<string, any> = new Map();
  private namespaces: Set<string> = new Set(["preferences", "usage", "experience"]);
  private immutableGraph = createImmutableGraph(mockGraph);

  async upsert({ vectors, namespace }: { vectors: any[]; namespace: string }) {
    // Validate namespace exists
    if (!this.namespaces.has(namespace)) {
      throw new Error(`Invalid namespace: ${namespace}`);
    }
    // Validate all vectors before storage
    vectors.forEach((vector) => {
      const validation = validateEmbeddingMetadata(vector.metadata, this.immutableGraph);

      if (!validation.isValid) {
        throw new Error(`Invalid vector metadata: ${validation.errors.join(", ")}`);
      }
    });

    vectors.forEach((vector) => {
      this.vectors.set(`${namespace}:${vector.id}`, vector);
    });

    return { upsertedCount: vectors.length };
  }

  async query({
    vector,
    topK = 10,
    namespace,
    includeMetadata = false,
    filter = {},
  }: {
    vector: number[];
    topK?: number;
    namespace?: string;
    includeMetadata?: boolean;
    filter?: Record<string, any>;
  }) {
    // Validate namespace if provided
    if (namespace && !this.namespaces.has(namespace)) {
      throw new Error(`Invalid namespace: ${namespace}`);
    }

    // Get vectors from specified namespace or all if not specified
    const relevantVectors = Array.from(this.vectors.entries())
      .filter(([key, _]) => {
        if (!namespace) return true;

        return key.startsWith(`${namespace}:`);
      })
      .map(([_, vector]) => vector);

    // Apply metadata filters if any
    const filteredVectors = relevantVectors.filter((vec) => {
      if (!Object.keys(filter).length) return true;

      return Object.entries(filter).every(([key, value]) => {
        if (Array.isArray(value)) {
          // For array values (like capabilities), check if any match
          const metadataValue = vec.metadata[key];

          return Array.isArray(metadataValue) && value.some((v) => metadataValue.includes(v));
        }

        return vec.metadata[key] === value;
      });
    });

    // Sort by similarity (mock scoring for testing)
    const matches = filteredVectors.slice(0, topK).map((vec) => ({
      id: vec.id,
      score: 0.95, // Mock similarity score
      values: includeMetadata ? vec.values : undefined,
      metadata: includeMetadata ? { ...vec.metadata } : undefined,
    }));

    return {
      matches,
      namespace: namespace || "default",
    };
  }

  async describeIndexStats(useRawCounts: boolean = false) {
    // Create a deep copy of mock stats
    const stats = JSON.parse(JSON.stringify(mockNamespaceStats));

    // Get actual vector counts
    const actualCounts = new Map<string, number>();

    for (const namespace of Array.from(this.namespaces)) {
      const namespaceVectors = Array.from(this.vectors.keys()).filter((key) => key.startsWith(`${namespace}:`));

      actualCounts.set(namespace, namespaceVectors.length);
    }

    // Always use raw counts when vectors exist
    if (this.vectors.size > 0) {
      for (const [namespace, count] of Array.from(actualCounts.entries())) {
        const currentCount = stats.namespaces[namespace as keyof typeof stats.namespaces].vectorCount;

        stats.namespaces[namespace as keyof typeof stats.namespaces].vectorCount = useRawCounts
          ? count
          : currentCount + count;
      }
      stats.totalVectorCount = useRawCounts ? this.vectors.size : stats.totalVectorCount + this.vectors.size;
    }

    return stats;
  }
}

export class MockPineconeClient {
  index(name: string) {
    if (name !== mockPineconeConfig.indexName) {
      throw new Error(`Invalid index name: ${name}`);
    }

    return new MockPineconeIndex();
  }
}

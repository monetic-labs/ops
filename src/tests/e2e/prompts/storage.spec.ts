import { createImmutableGraph, validateEmbeddingMetadata } from "@/knowledge-base/v0/graph/graph-validation";
import { EmbeddingMetadata } from "@/knowledge-base/v0/embedding";

import { test, expect } from "./mocks/pinecone-setup";
import { mockPineconeConfig } from "./fixtures/pinecone-index.fixture";
import { mockPineconeRecords } from "./fixtures/pinecone-index.fixture";
import { mockNamespaceStats } from "./fixtures/pinecone-namespace.fixture";
import { mockGraph } from "./fixtures/graph.fixture";

test.describe("Pinecone Storage Operations", () => {
  const immutableGraph = createImmutableGraph(mockGraph);

  test("should validate metadata against graph before storage", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);

    // Validate each record's metadata against the graph
    const validations = mockPineconeRecords.map((record) =>
      validateEmbeddingMetadata(record.metadata as EmbeddingMetadata, immutableGraph)
    );

    // All validations should pass
    validations.forEach((validation) => {
      expect(validation.isValid).toBeTruthy();
    });

    const result = await index.upsert({
      vectors: mockPineconeRecords,
      namespace: "preferences",
    });

    await expect(result.upsertedCount).toBe(mockPineconeRecords.length);
  });

  test("should initialize index with correct configuration", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);
    const stats = await index.describeIndexStats();

    await expect(stats).toEqual(mockNamespaceStats);
  });

  test("should store vectors in correct namespace", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);

    const result = await index.upsert({
      vectors: mockPineconeRecords,
      namespace: "preferences",
    });

    await expect(result.upsertedCount).toBe(mockPineconeRecords.length);
  });

  test("should retrieve vectors with metadata", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);

    // First insert the test vectors
    await index.upsert({
      vectors: mockPineconeRecords,
      namespace: "preferences",
    });

    const queryResult = await index.query({
      vector: new Array(1536).fill(0),
      topK: 2,
      namespace: "preferences",
      includeMetadata: true,
    });

    await expect(queryResult.matches[0].metadata.type).toBe("preference");
    await expect(queryResult.matches[1].metadata.type).toBe("usage");
  });

  test("should handle invalid index name", async ({ pinecone }) => {
    await expect(async () => {
      pinecone.index("invalid-index");
    }).rejects.toThrow("Invalid index name: invalid-index");
  });

  test("should maintain namespace isolation", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);

    // Store in different namespaces
    await Promise.all([
      index.upsert({
        vectors: [mockPineconeRecords[0]],
        namespace: "preferences",
      }),
      index.upsert({
        vectors: [mockPineconeRecords[1]],
        namespace: "usage",
      }),
    ]);

    const stats = await index.describeIndexStats();

    await expect(stats.namespaces).toHaveProperty("preferences");
    await expect(stats.namespaces).toHaveProperty("usage");
  });

  test("should reject vectors with invalid graph references", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);

    const invalidRecord = {
      ...mockPineconeRecords[0],
      metadata: {
        ...mockPineconeRecords[0].metadata,
        capabilities: ["non-existent-capability"],
      },
    };

    const validation = validateEmbeddingMetadata(invalidRecord.metadata as EmbeddingMetadata, immutableGraph);

    expect(validation.isValid).toBeFalsy();

    await expect(async () => {
      await index.upsert({
        vectors: [invalidRecord],
        namespace: "preferences",
      });
    }).rejects.toThrow();
  });

  test("should filter vectors by namespace and metadata", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);

    // First store some test vectors
    await index.upsert({
      vectors: mockPineconeRecords,
      namespace: "preferences",
    });

    // Query with filters
    const result = await index.query({
      vector: new Array(1536).fill(0),
      namespace: "preferences",
      includeMetadata: true,
      filter: {
        type: "preference",
        capabilities: ["transfers"],
      },
    });

    await expect(result.matches.length).toBeGreaterThan(0);
    await expect(result.matches[0].metadata.type).toBe("preference");
    await expect(result.matches[0].metadata.capabilities).toContain("transfers");
  });
});

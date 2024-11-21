import { test, expect } from "./mocks/pinecone-setup";
import { mockPineconeConfig } from "./fixtures/pinecone-index.fixture";
import { mockPineconeRecords } from "./fixtures/pinecone-index.fixture";
import { mockNamespaceStats, mockPineconeNamespaces } from "./fixtures/pinecone-namespace.fixture";

test.describe("Pinecone Namespace Operations", () => {
  test("should reject operations with invalid namespace", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);

    await expect(async () => {
      await index.upsert({
        vectors: mockPineconeRecords,
        namespace: "invalid-namespace",
      });
    }).rejects.toThrow("Invalid namespace: invalid-namespace");
  });

  test("should initialize with correct namespace structure", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);
    const stats = await index.describeIndexStats();

    // 1. Validate top-level stats
    expect(stats).toEqual(mockNamespaceStats);

    // 2. Validate namespace-specific properties
    Object.entries(mockPineconeNamespaces).forEach(([namespace, expected]) => {
      const actual = stats.namespaces[namespace];

      expect(actual).toEqual(expected);
    });
  });

  test("should maintain separate vector counts per namespace", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);

    await index.upsert({
      vectors: [mockPineconeRecords[0]],
      namespace: "preferences",
    });

    await index.upsert({
      vectors: [mockPineconeRecords[1]],
      namespace: "usage",
    });

    const stats = await index.describeIndexStats(true); // Use raw counts

    expect(stats.namespaces.preferences.vectorCount).toBe(1);
    expect(stats.namespaces.usage.vectorCount).toBe(1);
  });

  test("should filter queries by namespace", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);

    // Setup test data
    await index.upsert({
      vectors: [mockPineconeRecords[0]],
      namespace: "preferences",
    });

    await index.upsert({
      vectors: [mockPineconeRecords[1]],
      namespace: "usage",
    });

    // Query preferences namespace
    const prefResults = await index.query({
      vector: new Array(1536).fill(0),
      namespace: "preferences",
      includeMetadata: true,
    });

    expect(prefResults.namespace).toBe("preferences");
    expect(prefResults.matches.every((m: any) => m.metadata.type === "preference")).toBeTruthy();

    // Query usage namespace
    const usageResults = await index.query({
      vector: new Array(1536).fill(0),
      namespace: "usage",
      includeMetadata: true,
    });

    expect(usageResults.namespace).toBe("usage");
    expect(usageResults.matches.every((m: any) => m.metadata.type === "usage")).toBeTruthy();
  });

  test("should update namespace stats after vector operations", async ({ pinecone }) => {
    const index = pinecone.index(mockPineconeConfig.indexName);
    const initialStats = await index.describeIndexStats();

    await index.upsert({
      vectors: mockPineconeRecords,
      namespace: "preferences",
    });

    const updatedStats = await index.describeIndexStats(false); // Use cumulative counts

    expect(updatedStats.namespaces.preferences.vectorCount).toBe(
      initialStats.namespaces.preferences.vectorCount + mockPineconeRecords.length
    );
  });
});

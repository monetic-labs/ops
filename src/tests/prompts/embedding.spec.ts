import { test, expect } from "@playwright/test";

import { EmbeddingMetadata, validateEmbeddingMetadata } from "@/prompts/v0/embedding";
import { generateEmbeddings } from "@/prompts/v0/embedding";
import { createImmutableGraph } from "@/prompts/v0/functions/graph-validation";

import { mockSpeedPreference } from "./fixtures/preference.fixture";
import { mockContextChunks } from "./fixtures/context-chunk.fixture";
import { mockPineconeRecords } from "./fixtures/pinecone-index.fixture";
import { mockGraph } from "./fixtures/graph.fixture";
import { mockUsagePattern } from "./fixtures/usage.fixture";

test.describe("Embedding", () => {
  const immutableGraph = createImmutableGraph(mockGraph);

  test("should generate valid embeddings from preference data", async () => {
    const preference = mockSpeedPreference;
    const embedding = await generateEmbeddings(preference);

    await expect(embedding.values).toHaveLength(1536);
    await expect(embedding.metadata.type).toBe("preference");
    await expect(embedding.metadata.capabilities).toContain("transfers");
  });

  test("should process context chunks into embeddings", async () => {
    const chunks = mockContextChunks;
    const embeddings = await Promise.all(chunks.map((chunk) => generateEmbeddings(chunk)));

    await expect(embeddings).toHaveLength(chunks.length);
    await expect(embeddings[0].metadata.type).toBe("domain");
    await expect(embeddings[1].metadata.related_chunks).toContain("user-auth");
  });

  test("should validate embedding metadata against graph", async () => {
    const records = mockPineconeRecords;
    const validations = records.map((record) =>
      validateEmbeddingMetadata(record.metadata as EmbeddingMetadata, immutableGraph)
    );

    await expect(validations.every((v) => v.isValid)).toBeTruthy();
  });

  test("should handle malformed embedding data gracefully", async () => {
    const malformedData = {
      type: "unknown",
      content: "invalid",
    };

    await expect(async () => {
      await generateEmbeddings(malformedData);
    }).rejects.toThrow();
  });

  test("should maintain referential integrity in embeddings", async () => {
    const preference = mockSpeedPreference;
    const usage = mockUsagePattern;

    const [prefEmbedding, usageEmbedding] = await Promise.all([
      generateEmbeddings(preference),
      generateEmbeddings(usage),
    ]);

    // Verify capabilities referenced in both embeddings exist in graph
    const allCapabilities = new Set([
      ...(prefEmbedding.metadata.capabilities || []),
      ...(usageEmbedding.metadata.capabilities || []),
    ]);

    for (const cap of Array.from(allCapabilities)) {
      await expect(mockGraph.nodes[cap]).toBeDefined();
    }
  });
});

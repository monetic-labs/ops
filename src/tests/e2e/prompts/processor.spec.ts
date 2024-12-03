import { test, expect } from "@playwright/test";

import { generateEmbeddings } from "@/knowledge-base/v0/embedding";
import { createImmutableGraph } from "@/knowledge-base/v0/graph/graph-validation";

import { mockGraph } from "./fixtures/graph.fixture";
import { mockSpeedPreference } from "./fixtures/preference.fixture";
import { mockUsagePattern } from "./fixtures/usage.fixture";
import { mockContextChunks } from "./fixtures/context-chunk.fixture";

test.describe("Prompt Processing", () => {
  const immutableGraph = createImmutableGraph(mockGraph);

  test("processes preference data into valid embeddings", async () => {
    const embedding = await generateEmbeddings(mockSpeedPreference);

    await expect(embedding.metadata.type).toBe("preference");
    await expect(embedding.metadata.capabilities).toContain("transfers");
    await expect(embedding.metadata.domains).toContain("bill-pay");
  });

  test("processes usage patterns into valid embeddings", async () => {
    const embedding = await generateEmbeddings(mockUsagePattern);

    await expect(embedding.metadata.type).toBe("usage");
    await expect(embedding.metadata.capabilities).toContain("transfers");
    await expect(embedding.metadata.intent).toBe("quick_transfer");
  });

  test("processes context chunks in correct order", async () => {
    const embeddings = await Promise.all(mockContextChunks.map((chunk) => generateEmbeddings(chunk)));

    // Verify order is maintained based on priority
    const priorities = embeddings.map((e) => JSON.parse(e.metadata.content).priority);

    await expect(priorities).toEqual([1, 2, 3]);
  });

  test("maintains graph relationships in processed embeddings", async () => {
    const domainChunk = mockContextChunks[0]; // domain type chunk
    const embedding = await generateEmbeddings(domainChunk);

    // Verify related chunks match graph edges
    const relatedChunks = embedding.metadata.related_chunks || [];
    const graphEdges = immutableGraph.edges.filter((e) => e.from === "bill-pay");

    for (const edge of graphEdges) {
      await expect(relatedChunks).toContain(edge.to);
    }
  });
});

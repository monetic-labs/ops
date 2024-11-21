import { test, expect } from "@playwright/test";

import { generateEmbeddings } from "@/prompts/v0/embedding";
import { createImmutableGraph, validateEmbeddingMetadata } from "@/prompts/v0/functions/graph-validation";
import { Graph } from "@/prompts/v0/functions/graph";

import { mockContextChunks } from "./fixtures/context-chunk.fixture";
import { mockGraph } from "./fixtures/graph.fixture";

test.describe("Embedding Generation and Validation Integration", () => {
  const immutableGraph = createImmutableGraph(mockGraph);

  test("validates generated embeddings against graph structure", async () => {
    const embeddings = await Promise.all(mockContextChunks.map((chunk) => generateEmbeddings(chunk)));

    const validations = embeddings.map((embedding) => validateEmbeddingMetadata(embedding.metadata, immutableGraph));

    // All validations should pass
    validations.forEach((validation, index) => {
      expect(validation.isValid, `Validation failed for chunk ${index}: ${validation.errors.join(", ")}`).toBeTruthy();
    });
  });

  test("maintains graph edge relationships in generated embeddings", async () => {
    // Get domain chunk that references transfers capability
    const domainChunk = mockContextChunks[0];
    const embedding = await generateEmbeddings(domainChunk);

    // Verify the embedding maintains the graph relationship
    const validation = validateEmbeddingMetadata(embedding.metadata, immutableGraph);

    expect(validation.isValid).toBeTruthy();

    // Check that related chunks match graph edges
    const relatedNodes = embedding.metadata.related_chunks || [];
    const graphEdges = immutableGraph.edges.filter((e) => e.from === "bill-pay").map((e) => e.to);

    graphEdges.forEach((node) => {
      expect(relatedNodes).toContain(node);
    });
  });

  test("handles circular references in graph validation", async () => {
    // Create a chunk with circular reference
    const circularChunk = {
      type: "capability",
      priority: 1,
      content: "Circular reference test",
      related_chunks: ["bill-pay", "transfers"],
    };

    const embedding = await generateEmbeddings(circularChunk);
    const validation = validateEmbeddingMetadata(embedding.metadata, immutableGraph);

    expect(validation.isValid).toBeTruthy();
  });

  test("fails validation with invalid node references", async () => {
    const invalidChunk = {
      type: "domain",
      priority: 1,
      content: "Invalid domain test",
      related_chunks: ["nonexistent-node", "invalid-capability"],
    };

    const embedding = await generateEmbeddings(invalidChunk);
    const validation = validateEmbeddingMetadata(embedding.metadata, immutableGraph);

    expect(validation.isValid).toBeFalsy();
    expect(validation.errors).toContain("Invalid related chunk reference: nonexistent-node");
    expect(validation.errors).toContain("Invalid related chunk reference: invalid-capability");
  });

  test("handles large graph validation performance", async () => {
    // Generate large graph with 1000 nodes
    const largeGraph: Graph = {
      nodes: {},
      edges: [],
    };

    // Add 1000 nodes
    for (let i = 0; i < 1000; i++) {
      const isCapability = i % 2 === 0;
      const nodeType = isCapability ? "capability" : "domain";

      largeGraph.nodes[`node-${i}`] = {
        type: nodeType,
        description: `Test ${nodeType} ${i}`,
        requires: isCapability ? ["user-auth"] : undefined,
        ui_component: `component-${i}`,
      };
    }

    // Add edges between nodes
    for (let i = 0; i < 999; i++) {
      largeGraph.edges.push({
        from: `node-${i}`,
        to: `node-${i + 1}`,
        relationship: "provides",
      });
    }

    const immutableLargeGraph = createImmutableGraph(largeGraph);

    // Create test chunk referencing multiple nodes
    const complexChunk = {
      type: "domain",
      priority: 1,
      content: "Performance test chunk",
      related_chunks: Array.from({ length: 100 }, (_, i) => `node-${i}`),
    };

    const startTime = performance.now();

    const embedding = await generateEmbeddings(complexChunk);
    const validation = validateEmbeddingMetadata(embedding.metadata, immutableLargeGraph);

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(validation.isValid).toBeTruthy();
    expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
  });
});

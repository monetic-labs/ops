import { NextResponse } from "next/server";
import { pinecone } from "@/libs/pinecone/pinecone";
import { bootstrapKnowledgeBase } from "@/knowledge-base/v0/bootstrap";
import { validateEmbeddingMetadata } from "@/knowledge-base/v0/graph/graph-validation";
import { Graph } from "@/knowledge-base/v0/graph/graph";
import { PineconeRecord } from "@/libs/pinecone/types";
import { formatMetadataForPinecone } from "@/knowledge-base/v0/kb-helpers";
import { IndexStats } from "@/components/embeddings/kb-stats";

import { KNOWLEDGE_BASE_CONFIG, PINECONE_CONFIG } from "@/knowledge-base/config";

const INDEX_NAME = KNOWLEDGE_BASE_CONFIG.index;
const DIMENSION = KNOWLEDGE_BASE_CONFIG.dimension;

export async function POST() {
  try {
    // 1. List existing indexes first
    const indexes = await pinecone.listIndexes();
    console.log("Existing indexes:", indexes);

    // 2. Check if our index exists
    let index;
    const indexExists = indexes?.indexes?.some(idx => idx.name === INDEX_NAME);

    if (!indexExists) {
      console.log(`Index ${INDEX_NAME} not found, creating...`);
      try {
        await pinecone.createIndex({
          name: INDEX_NAME,
          dimension: DIMENSION,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: PINECONE_CONFIG.cloud,
              region: PINECONE_CONFIG.region
            }
          }
        });

        console.log("Waiting for index to be ready...");
        await new Promise(resolve => setTimeout(resolve, 30000));
      } catch (error) {
        console.error("Error creating index:", error);
        throw new Error(`Failed to create index: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // 3. Get index reference and stats
    try {
      index = pinecone.index(INDEX_NAME);
      const indexStats = await index.describeIndexStats();
      console.log("Initial index stats:", indexStats);

    // 4. Delete existing data - SKIP deletion if we get a 404 (empty index)
    try {
      if (indexStats.totalRecordCount && indexStats.totalRecordCount > 0) {
        await index.deleteAll();
        console.log("Deleted all existing vectors");
      } else {
        console.log("Index is empty, skipping deletion");
      }
    } catch (error: any) {
        // If we get a 404, the index is empty - this is fine
        if (error?.response?.status === 404 || error?.status === 404) {
          console.log("Index is empty, continuing with bootstrap");
        } else {
          console.error("Error deleting data:", error);
          throw error;
        }
      }

    } catch (error) {
      console.error("Error accessing index:", error);
      throw new Error(`Failed to access index: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // 5. Generate and validate embeddings
    console.log("Generating embeddings...");
    const embeddings = await bootstrapKnowledgeBase();
    const batchSize = 100;
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Load graph for validation
    const graphData = await import("@/knowledge-base/v0/graph/graph.json");
    const graph = graphData as Graph;

    // 6. Process in batches
    console.log(`Processing ${embeddings.length} embeddings in batches of ${batchSize}`);
    for (let i = 0; i < embeddings.length; i += batchSize) {
      const batch = embeddings.slice(i, i + batchSize);
      const validBatch: PineconeRecord[] = [];

      for (const emb of batch) {
        const validation = validateEmbeddingMetadata(emb.metadata, graph);
        if (validation.isValid) {
          validBatch.push({
            id: emb.id,
            values: emb.values,
            metadata: formatMetadataForPinecone(emb.metadata)
          });
        } else {
          results.failed++;
          results.errors.push(`Invalid embedding ${emb.id}: ${validation.errors.join(", ")}`);
        }
      }

      try {
        if (validBatch.length > 0) {
          await index.upsert(validBatch);
          results.success += validBatch.length;
          console.log(`Uploaded batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(embeddings.length/batchSize)}`);
        }
      } catch (error) {
        results.failed += batch.length;
        results.errors.push(`Batch upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // 7. Get final stats
    const finalStats = await index.describeIndexStats();
    console.log("Final index stats:", finalStats);

    return NextResponse.json({
      success: true,
      results,
      stats: {
        totalDocuments: finalStats.totalRecordCount,
        namespaces: finalStats.namespaces
      }
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    return NextResponse.json({ 
      error: "Bootstrap failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
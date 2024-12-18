import { pinecone } from "@/libs/pinecone/pinecone";
import { knowledgeBase } from "@/libs/openai/retrieve";
import { KNOWLEDGE_BASE_CONFIG, PINECONE_CONFIG } from "@/knowledge-base/config";

import { getEmbedding } from "./openai/embedding";

async function initializePineconeIndex() {
  try {
    // Check if index exists
    const existingIndexes = await pinecone.listIndexes();

    if (!existingIndexes.indexes?.some((index) => index.name === "fintech-knowledge")) {
      // Create index if it doesn't exist
      await pinecone.createIndex({
        name: KNOWLEDGE_BASE_CONFIG.index,
        dimension: KNOWLEDGE_BASE_CONFIG.dimension, // OpenAI ada-002 embedding dimension
        metric: PINECONE_CONFIG.metric,
        spec: {
          serverless: {
            cloud: PINECONE_CONFIG.cloud,
            region: PINECONE_CONFIG.region,
          },
        },
      });
      console.log("Created new Pinecone index: fintech-knowledge");
    } else {
      console.log("Pinecone index already exists: fintech-knowledge");
    }

    // Get reference to the index
    const index = pinecone.index("fintech-knowledge");

    // Populate index with knowledge base
    for (const [category, texts] of Object.entries(knowledgeBase)) {
      console.log(`Processing category: ${category}`);
      for (const text of texts) {
        const embedding = await getEmbedding(text);

        await index.upsert([
          {
            id: `${category}-${Date.now()}`,
            values: embedding,
            metadata: {
              text: text,
              category,
            },
          },
        ]);
      }
    }

    console.log("Successfully populated Pinecone index");
  } catch (error) {
    console.error("Error initializing Pinecone index:", error);
    throw error;
  }
}

initializePineconeIndex().catch(console.error);

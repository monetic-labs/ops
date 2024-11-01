import { pinecone } from "@/libs/pinecone";
import { knowledgeBase } from "@/libs/openai/retrieve";

import { getEmbedding } from "./openai/embedding";

async function initializePineconeIndex() {
  try {
    // Check if index exists
    const existingIndexes = await pinecone.listIndexes();

    if (!existingIndexes.indexes?.some((index) => index.name === "fintech-knowledge")) {
      // Create index if it doesn't exist
      await pinecone.createIndex({
        name: "fintech-knowledge",
        dimension: 1536, // OpenAI ada-002 embedding dimension
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
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
              text,
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

import { OPENAI_MODELS } from "@/knowledge-base/config";

import { openai } from "./client";

export async function getEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: OPENAI_MODELS.embedding.default,
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { PineconeNotFoundError } from "@pinecone-database/pinecone/dist/errors";
import { PineconeConnectionError } from "@pinecone-database/pinecone/dist/errors";

import { getEmbedding } from "@/libs/openai/embedding";
import { pinecone } from "@/libs/pinecone/pinecone";
import { OPENAI_MODELS, RETRIEVAL_CONFIG, SYSTEM_PROMPTS } from "@/knowledge-base/config";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Get embedding for the query
    const queryEmbedding = await getEmbedding(lastMessage.content);

    try {
      const index = pinecone.index(RETRIEVAL_CONFIG.pinecone.namespace);
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: RETRIEVAL_CONFIG.pinecone.topK,
        includeMetadata: true,
      });

      // Extract context from vector search results
      const vectorContext = queryResponse.matches
        .map((match) => match.metadata?.text)
        .filter(Boolean)
        .join("\n\n");

      // Fallback context if no relevant results found
      const defaultContext = "Default context for you bitches!";

      const context = vectorContext || defaultContext;

      const result = await streamText({
        messages: convertToCoreMessages(messages),
        model: openai(OPENAI_MODELS.chat.default),
        system: `${SYSTEM_PROMPTS.default}\n---\n${context}\n---\n`,
      });

      return result.toDataStreamResponse();
    } catch (error) {
      if (error instanceof PineconeConnectionError || error instanceof PineconeNotFoundError) {
        console.error("Pinecone error:", error);
        // Fallback to default context
        const result = await streamText({
          messages: convertToCoreMessages(messages),
          model: openai(OPENAI_MODELS.chat.fallback),
          system: SYSTEM_PROMPTS.fallback,
        });

        return result.toDataStreamResponse();
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    console.error("Chat API error:", error);
    if (error instanceof Error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }

    return new Response("An unexpected error occurred", { status: 500 });
  }
}

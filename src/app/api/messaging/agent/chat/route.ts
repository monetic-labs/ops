import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { PineconeNotFoundError } from "@pinecone-database/pinecone/dist/errors";
import { PineconeConnectionError } from "@pinecone-database/pinecone/dist/errors";

import { getEmbedding } from "@/libs/openai/embedding";
import { pinecone } from "@/libs/pinecone/pinecone";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Get embedding for the query
    const queryEmbedding = await getEmbedding(lastMessage.content);

    try {
      const index = pinecone.index("fintech-knowledge");
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 5,
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
        model: openai("gpt-4-turbo"),
        system: `You are a self banking customer support specialist. Use this context to answer questions:
            \n---\n${context}\n---\n
            If the context doesn't contain relevant information, use your general knowledge about fintech.`,
      });

      return result.toDataStreamResponse();
    } catch (error) {
      if (error instanceof PineconeConnectionError || error instanceof PineconeNotFoundError) {
        console.error("Pinecone error:", error);
        // Fallback to default context
        const result = await streamText({
          messages: convertToCoreMessages(messages),
          model: openai("gpt-4-turbo"),
          system: "I am a helpful assistant focused on financial technology support...",
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

import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";

import { getEmbedding } from "@/libs/openai/embedding";
import { pinecone } from "@/libs/pinecone";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Get embedding for the query
    const queryEmbedding = await getEmbedding(lastMessage.content);

    // Query Pinecone using shared client
    const index = pinecone.index("fintech-knowledge");

    try {
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
      const defaultContext =
        "I am a helpful assistant focused on financial technology support. " +
        "I can help with bill pay, card issuance, back office operations, user management, " +
        "transactions, alerts, and compliance. Use @ mentions to get specific information about these topics.";

      const context = vectorContext || defaultContext;

      const result = await streamText({
        messages: convertToCoreMessages(messages),
        model: openai("gpt-4-turbo"),
        system: `You are a helpful fintech support assistant. Use this context to answer questions:
            \n---\n${context}\n---\n
            If the context doesn't contain relevant information, use your general knowledge about fintech.`,
      });

      return result.toDataStreamResponse();
    } catch (error) {
      console.error("Pinecone query error:", error);
      // Fallback to default context if Pinecone fails
      const result = await streamText({
        messages: convertToCoreMessages(messages),
        model: openai("gpt-4-turbo"),
        system:
          "I am a helpful assistant focused on financial technology support. " +
          "I can help with bill pay, card issuance, back office operations, user management, " +
          "transactions, alerts, and compliance.",
      });

      return result.toDataStreamResponse();
    }
  } catch (error) {
    console.error("Chat API error:", error);
    if (error instanceof Error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }

    return new Response("An unexpected error occurred", { status: 500 });
  }
}

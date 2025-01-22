import type { Message as AIMessage } from "ai";

import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { PineconeNotFoundError, PineconeConnectionError } from "@pinecone-database/pinecone/dist/errors";

import { getEmbedding } from "@/libs/openai/embedding";
import { pinecone } from "@/libs/pinecone/pinecone";
import { OPENAI_MODELS, RETRIEVAL_CONFIG, SYSTEM_PROMPTS } from "@/knowledge-base/config";

export const runtime = "edge";

interface ChatRequestBody {
  messages: {
    role: "user" | "assistant" | "system" | "function" | "data" | "tool";
    content: string;
    id?: string;
  }[];
  userId: string;
}

/**
 * Processes vector store matches to create context for the AI
 */
const processVectorMatches = (matches: any[]) => {
  return matches
    .map((match) => {
      try {
        const contentStr =
          typeof match.metadata?.content === "string"
            ? match.metadata.content
            : JSON.stringify(match.metadata?.content);

        const parsed = JSON.parse(contentStr);
        const content = JSON.parse(parsed.content);
        const typePrefix = parsed.type.toUpperCase();
        const description = content.description || content.user_intent;

        return description ? `[${typePrefix}]: ${description}` : null;
      } catch (e) {
        console.error("Error parsing metadata:", {
          error: e,
          matchId: match.id,
          hasMetadata: !!match.metadata,
        });

        return null;
      }
    })
    .filter(Boolean)
    .join("\n\n");
};

/**
 * Creates a fallback response when vector store is unavailable
 */
const createFallbackResponse = async (messages: AIMessage[], userId: string) => {
  console.log("Using fallback response for userId:", userId);

  const result = await streamText({
    messages: convertToCoreMessages(messages),
    model: openai(OPENAI_MODELS.chat.fallback),
    system: `${SYSTEM_PROMPTS.fallback}\n---\nUser ID: ${userId}\n---\n`,
  });

  return result.toDataStreamResponse();
};

export async function POST(req: Request) {
  try {
    const { messages, userId = "default-user" } = (await req.json()) as ChatRequestBody;

    if (!messages?.length) {
      return new Response("No messages provided", { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];

    console.log("Processing chat request:", {
      userId,
      messageCount: messages.length,
      lastMessage: lastMessage.content,
    });

    // Get embedding for the query
    const queryEmbedding = await getEmbedding(lastMessage.content);

    console.log("Query context:", {
      userId,
      vectorLength: queryEmbedding.length,
      namespace: RETRIEVAL_CONFIG.pinecone.namespace,
    });

    try {
      // Query vector store for relevant context
      const index = pinecone.index(RETRIEVAL_CONFIG.pinecone.namespace);
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: RETRIEVAL_CONFIG.pinecone.topK,
        includeMetadata: true,
      });

      // Process vector matches into context
      const vectorContext = processVectorMatches(queryResponse.matches);
      const context = vectorContext || "I am an AI assistant helping with financial services.";
      const systemPrompt = `${SYSTEM_PROMPTS.default}\n---\nUser ID: ${userId}\n---\n${context}\n---\n`;

      // Generate and stream response
      const result = await streamText({
        messages: messages as AIMessage[],
        model: openai(OPENAI_MODELS.chat.default),
        system: systemPrompt,
      });

      return result.toDataStreamResponse();
    } catch (error) {
      // Handle vector store errors gracefully
      if (error instanceof PineconeConnectionError || error instanceof PineconeNotFoundError) {
        console.error("Falling back to default context due to Pinecone error:", error);

        return createFallbackResponse(messages as AIMessage[], userId);
      }
      throw error;
    }
  } catch (error) {
    console.error("Chat API error:", {
      error,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

    if (error instanceof Error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }

    return new Response("An unexpected error occurred", { status: 500 });
  }
}

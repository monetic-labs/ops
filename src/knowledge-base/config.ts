/**
 * OpenAI model configurations for different use cases
 */
export const OPENAI_MODELS = {
  chat: {
    default: "gpt-4-turbo",
    fallback: "gpt-3.5-turbo",
  },
  embedding: {
    default: "text-embedding-ada-002",
  },
} as const;

/**
 * Default parameters for chat completions
 */
export const CHAT_SETTINGS = {
  temperature: 0.7,
  max_tokens: 1000,
  top_p: 0.9,
  frequency_penalty: 0,
  presence_penalty: 0,
} as const;

/**
 * System prompts for different conversation contexts
 */
export const SYSTEM_PROMPTS = {
  default: `You are a self banking customer support specialist. Use the provided context to answer questions.
    If the context doesn't contain relevant information, use your general knowledge about fintech.`,

  fallback: `I am a helpful assistant focused on financial technology support. 
    I can help with general banking, payments, and financial technology questions.`,
} as const;

/**
 * Configuration for the knowledge base index
 */
export const KNOWLEDGE_BASE_CONFIG = {
  index: "fintech-knowledge",
  dimension: 1536,
} as const;

/**
 * Settings for document retrieval operations
 */
export const RETRIEVAL_CONFIG = {
  pinecone: {
    topK: 5,
    namespace: KNOWLEDGE_BASE_CONFIG.index,
  },
} as const;

/**
 * Pinecone vector database configuration
 */
export const PINECONE_CONFIG = {
  metric: "cosine",
  cloud: "aws",
  region: "us-east-1",
} as const;

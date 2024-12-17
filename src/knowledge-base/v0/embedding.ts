import { getEmbedding } from "@/libs/openai/embedding";

import { Graph } from "./graph/graph";

export interface EmbeddingMetadata {
  type: "preference" | "usage" | "domain" | "capability" | "experience" | "system";
  content: string;
  capabilities?: string[];
  domains?: string[];
  preference_type?: string;
  intent?: string;
  related_chunks?: string[];
  energy_type?: string;
  traits?: string[];
  decision_style?: {
    speed_multiplier: number;
    risk_tolerance: string;
    waiting_period: string;
  };
}

export interface Embedding {
  id: string;
  values: number[];
  metadata: EmbeddingMetadata;
}

export async function generateEmbeddings(
  data: any,
  options?: {
    model?: string;
    dimension?: number;
  }
): Promise<Embedding> {
  // Validate input data
  if (!data || typeof data !== "object") {
    console.error("Invalid input data:", data);
    throw new Error("Invalid input data for embedding generation");
  }

  // Extract type based on data structure
  let type: EmbeddingMetadata["type"];

  console.log("Checking data type:", {
    hasType: "type" in data,
    type: data.type,
    hasPreferenceType: "preference_type" in data,
    hasIntent: "intent" in data,
  });

  if ("type" in data && ["domain", "capability", "usage", "system", "experience", "preference"].includes(data.type)) {
    type = data.type;
  } else if ("preference_type" in data) {
    type = "preference";
  } else if ("intent" in data) {
    type = "usage";
  } else {
    console.error("Unable to determine type from data:", data);
    throw new Error("Unable to determine valid embedding type from data");
  }

  // Generate a deterministic ID based on content and type
  const id = `${type}-${Date.now()}`;

  // Extract metadata based on data type
  const metadata: EmbeddingMetadata = {
    type,
    content: JSON.stringify(data),
    capabilities: data.capabilities || data.context?.capabilities || [],
    domains: data.domains || data.context?.domains || [],
    preference_type: data.preference_type,
    intent: data.intent,
    related_chunks: data.related_chunks || [],
    energy_type: data.energy_type,
    traits: data.traits,
    decision_style: data.decision_style,
  };

  try {
    // Create text for embedding that captures the essential meaning
    const embeddingText = [
      `Type: ${type}`,
      `Description: ${data.description || ""}`,
      `Content: ${metadata.content}`,
      data.capabilities ? `Capabilities: ${data.capabilities.join(", ")}` : "",
      data.domains ? `Domains: ${data.domains.join(", ")}` : "",
      data.traits ? `Traits: ${data.traits.join(", ")}` : "",
      data.intent ? `Intent: ${data.intent}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    console.log(`Generating embedding for ${id}...`);
    const values = await getEmbedding(embeddingText);

    if (!values || values.length === 0) {
      throw new Error("OpenAI returned empty embedding");
    }

    console.log(`Successfully generated embedding for ${id} with ${values.length} dimensions`);

    return {
      id,
      values,
      metadata,
    };
  } catch (error) {
    console.error(`Error generating embedding for ${id}:`, error);
    throw new Error(
      `Failed to generate embedding for ${id}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export function validateEmbeddingMetadata(
  metadata: EmbeddingMetadata,
  graph: Graph
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Log the validation attempt
  console.log("Validating metadata:", {
    type: metadata.type,
    hasCapabilities: Boolean(metadata.capabilities?.length),
    hasDomains: Boolean(metadata.domains?.length),
    content: metadata.content.substring(0, 100) + "...", // Log truncated content for debugging
  });

  // Validate metadata type
  if (!["preference", "usage", "domain", "capability", "experience", "system"].includes(metadata.type)) {
    errors.push(`Invalid metadata type: ${metadata.type}`);

    return { isValid: false, errors };
  }

  // Skip further validation for system type
  if (metadata.type === "system") {
    return { isValid: true, errors: [] };
  }

  // Skip capability/domain validation for experience type
  if (metadata.type === "experience") {
    // Validate only required fields for experience type
    if (metadata.traits) {
      metadata.traits.forEach((trait) => {
        if (!graph.nodes[trait]) {
          errors.push(`Invalid trait reference: ${trait}`);
        }
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  // Validate capabilities exist in graph
  if (metadata.capabilities?.length) {
    metadata.capabilities.forEach((cap) => {
      if (!graph.nodes[cap]) {
        errors.push(`Invalid capability reference: ${cap}`);
      } else if (graph.nodes[cap].type !== "capability") {
        errors.push(`Node ${cap} exists but is not a capability`);
      }
    });
  }

  // Validate domains exist in graph
  if (metadata.domains?.length) {
    metadata.domains.forEach((domain) => {
      if (!graph.nodes[domain]) {
        errors.push(`Invalid domain reference: ${domain}`);
      } else if (graph.nodes[domain].type !== "domain") {
        errors.push(`Node ${domain} exists but is not a domain`);
      }
    });
  }

  // Validate related chunks exist in graph
  if (metadata.related_chunks?.length) {
    metadata.related_chunks.forEach((chunk) => {
      if (!graph.nodes[chunk] && chunk !== "user-auth") {
        errors.push(`Invalid related chunk reference: ${chunk}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

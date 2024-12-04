import { Graph } from "./graph/graph";

export interface EmbeddingMetadata {
  type: "preference" | "usage" | "domain" | "capability" | "experience" | "system"  ;
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
    throw new Error("Invalid input data for embedding generation");
  }

  // Extract type based on data structure
  let type: EmbeddingMetadata["type"];

  if ("type" in data && ["domain", "capability", "usage"].includes(data.type)) {
    // Handle context chunks that explicitly declare their type
    type = data.type;
  } else if ("preference_type" in data) {
    type = "preference";
  } else if ("intent" in data) {
    type = "usage";
  } else {
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
  };

  // In a real implementation, we'd call an embedding API here
  // For now, return mock embeddings
  return {
    id,
    values: new Array(options?.dimension || 1536).fill(0),
    metadata,
  };
}

export function validateEmbeddingMetadata(
  metadata: EmbeddingMetadata,
  graph: Graph
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  console.log("Graph nodes:", Object.keys(graph.nodes)); // Debug log

  // Validate capabilities exist in graph
  if (metadata.capabilities) {
    metadata.capabilities.forEach((cap) => {
      if (!graph.nodes[cap]) {
        errors.push(`Invalid capability reference: ${cap}`);
      } else if (graph.nodes[cap].type !== "capability") {
        errors.push(`Node ${cap} exists but is not a capability`);
      }
    });
  }

  // Validate domains exist in graph
  if (metadata.domains) {
    metadata.domains.forEach((domain) => {
      console.log("Validating domain:", domain, "Node:", graph.nodes[domain]); // Debug log
      if (!graph.nodes[domain]) {
        errors.push(`Invalid domain reference: ${domain}`);
      } else if (graph.nodes[domain].type !== "domain") {
        errors.push(`Node ${domain} exists but is not a domain`);
      }
    });
  }

  // Validate metadata type
  if (!["preference", "usage", "domain", "capability"].includes(metadata.type)) {
    errors.push(`Invalid metadata type: ${metadata.type}`);
  }

  // Validate related chunks exist in graph
  if (metadata.related_chunks) {
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

import { EmbeddingMetadata } from "../embedding";

import { Graph, GraphNode } from "./graph";

// Pure function to create an immutable graph
export const createImmutableGraph = (graph: Graph): Readonly<Graph> => Object.freeze(JSON.parse(JSON.stringify(graph)));

// Pure validation functions
export const validateCapability = (capability: string, nodes: Record<string, GraphNode>): string[] => {
  const errors: string[] = [];

  if (!nodes[capability]) {
    errors.push(`Invalid capability reference: ${capability}`);
  } else if (nodes[capability].type !== "capability") {
    errors.push(`Node ${capability} exists but is not a capability`);
  }

  return errors;
};

export const validateDomain = (domain: string, nodes: Record<string, GraphNode>): string[] => {
  const errors: string[] = [];

  if (!nodes[domain]) {
    errors.push(`Invalid domain reference: ${domain}`);
  } else if (nodes[domain].type !== "domain") {
    errors.push(`Node ${domain} exists but is not a domain`);
  }

  return errors;
};

export const validateMetadataType = (type: string): string[] => {
  const validTypes = ["preference", "usage", "domain", "capability"] as const;

  return validTypes.includes(type as (typeof validTypes)[number]) ? [] : [`Invalid metadata type: ${type}`];
};

export const validateRelatedChunks = (chunks: string[], nodes: Record<string, GraphNode>): string[] => {
  return chunks
    .filter((chunk) => chunk !== "user-auth" && !nodes[chunk])
    .map((chunk) => `Invalid related chunk reference: ${chunk}`);
};

// Composition of validation functions
export const validateEmbeddingMetadata = (
  metadata: EmbeddingMetadata,
  graph: Readonly<Graph>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [
    ...(metadata.capabilities?.flatMap((cap) => validateCapability(cap, graph.nodes)) ?? []),
    ...(metadata.domains?.flatMap((domain) => validateDomain(domain, graph.nodes)) ?? []),
    ...validateMetadataType(metadata.type),
    ...validateRelatedChunks(metadata.related_chunks ?? [], graph.nodes),
  ];

  return {
    isValid: errors.length === 0,
    errors,
  };
};

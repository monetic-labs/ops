import { Graph } from "./graph/graph";

interface ContextChunk {
  type: "domain" | "capability" | "usage" | "experience" | "system";
  priority: number;
  content: string;
  related_chunks: string[];
}

export function chunkGraphData(graph: Graph): ContextChunk[] {
  const chunks: ContextChunk[] = [];

  // Chunk nodes by type
  for (const [nodeId, node] of Object.entries(graph.nodes)) {

    // Validate node type before creating chunk
    const validType = validateNodeType(node.type);
    if (!validType) {
      console.warn(`Skipping node ${nodeId} with invalid type: ${node.type}`);
      continue;
    }

    const chunk: ContextChunk = {
      type: validType,
      priority: getPriorityByType(validType),
      content: JSON.stringify({
        id: nodeId,
        ...node,
        // Include energy type specific fields
        traits: node.traits,
        financial_strengths: node.financial_strengths,
        financial_challenges: node.financial_challenges,
        decision_style: node.decision_style,
        optimal_capabilities: node.optimal_capabilities
      }),
      related_chunks: graph.edges
        .filter(e => e.from === nodeId || e.to === nodeId)
        .map(e => e.from === nodeId ? e.to : e.from)
    };

    chunks.push(chunk);
  }

  return chunks;
}

function validateNodeType(type: string): ContextChunk["type"] | null {
  const validTypes = ["domain", "capability", "usage", "experience", "system"] as const;
  return validTypes.includes(type as any) ? type as ContextChunk["type"] : null;
}

function getPriorityByType(type: string): number {
  switch(type) {
    case "domain": return 1;
    case "capability": return 2;
    case "experience": return 3;
    case "system": return 4;
    case "usage": return 5;
    default: return 0;
  }
}
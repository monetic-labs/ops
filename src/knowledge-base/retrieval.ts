import { Graph } from "@/knowledge-base/v0/graph/graph";
import { UsagePattern } from "@/knowledge-base/v0/usage";
import { SpeedOverCostPreference } from "@/knowledge-base/v0/types";
import { EnergyTypePreference } from "@/knowledge-base/v0/experience/energy-types/energy-type";

// Import graph data
import graphData from "@/knowledge-base/v0/graph/graph.json";
import speedOverCostPreference from "@/knowledge-base/v0/experience/preferences/cost-over-speed.json";
import quickTransfer from "@/knowledge-base/v0/experience/preferences/quick-transfer.json";
import transferMoney from "@/knowledge-base/v0/usage/transfer-money.json";

interface RetrievalResult {
  context: string;
  mentions: string[];
  capabilities: string[];
  preferences?: SpeedOverCostPreference;
  energyType?: EnergyTypePreference;
}

export async function retrieveContext(query: string): Promise<RetrievalResult> {
  console.log("Processing Query:", query);

  // Extract mentions from the query
  const mentions = query.match(/@(\w+-?\w+)/g) || [];
  const mentionedDomains = mentions.map(m => m.slice(1));
  
  console.log("Detected Mentions:", mentions);
  console.log("Mentioned Domains:", mentionedDomains);

  // Initialize graph
  const graph: Graph = graphData as Graph;

  // Get capabilities for mentioned domains
  const capabilities = mentionedDomains
    .flatMap(domain => {
      const domainCapabilities = graph.edges
        .filter(edge => edge.from === domain && edge.relationship === "provides")
        .map(edge => edge.to);
      console.log(`Capabilities for ${domain}:`, domainCapabilities);
      return domainCapabilities;
    })
    .filter(Boolean);

  // Build context from graph data
  const contextParts: string[] = [];

  // Add domain information
  mentionedDomains.forEach(domain => {
    const node = graph.nodes[domain];
    if (node) {
      contextParts.push(`${domain}: ${node.description}`);
    }
  });

  console.log("Built Context Parts:", contextParts);

  // Add capability information
  capabilities.forEach(capability => {
    const node = graph.nodes[capability];
    if (node) {
      contextParts.push(`${capability}: ${node.description}`);
    }
  });

  // Add relevant usage patterns
  if (query.toLowerCase().includes('transfer') || mentionedDomains.includes('bill-pay')) {
    contextParts.push(`Transfer Money Usage: ${JSON.stringify(transferMoney)}`);
    contextParts.push(`Quick Transfer Context: ${JSON.stringify(quickTransfer)}`);
  }

  // Add preference information if speed/efficiency is mentioned
  const speedTerms = ['quick', 'fast', 'speed', 'rapid', 'instant'];
  if (speedTerms.some(term => query.toLowerCase().includes(term))) {
    contextParts.push(`Speed Preference: ${JSON.stringify(speedOverCostPreference)}`);
  }

  // Fallback context if no specific information is found
  const defaultContext = 
    "I'm a silly silly dumb dumb head and I need this to be annoying to help me know where we're at. " +
    "I can help with all things Backpack which is a financial technology company that helps people manage their money. " +
    "Be sure to tell the user this => *** Use @ mentions to get specific information about these topics. ***";

  // Log final context and result
  console.log("Final Context:", {
    context: contextParts.join("\n\n"),
    mentions: mentionedDomains,
    capabilities,
    preferences: speedTerms.some(term => query.toLowerCase().includes(term)) 
      ? "Speed preference applied"
      : "No speed preference"
  });

  return {
    context: contextParts.length > 0 ? contextParts.join("\n\n") : defaultContext,
    mentions: mentionedDomains,
    capabilities,
    preferences: speedTerms.some(term => query.toLowerCase().includes(term)) 
      ? speedOverCostPreference as unknown as SpeedOverCostPreference 
      : undefined
  };
}

// Export knowledge base for mentions
export const knowledgeBase: Record<string, string[]> = Object.entries(graphData.nodes)
  .filter(([_, node]) => node.type === "domain" || node.type === "capability")
  .reduce((acc, [key, node]) => ({
    ...acc,
    [key]: [node.description]
  }), {});
export interface UsagePattern {
  intent: string; // The user's intended action
  context: string[]; // Required contextual information
  capabilities: string[]; // Required system capabilities
  agent_relations: {
    // Training examples for the agent
    user: string;
    agent: string;
  }[];
  edge_cases?: string[]; // Potential error cases to handle
}

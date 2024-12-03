import { UsagePattern } from "@/knowledge-base/v0/usage";

export const mockUsagePattern: UsagePattern = {
  intent: "quick_transfer",
  context: ["user-auth"],
  capabilities: ["transfers"],
  example_dialogue: [
    {
      user: "I need to send money quickly",
      system: "I'll help you make a fast transfer",
    },
  ],
  edge_cases: ["insufficient_funds"],
};

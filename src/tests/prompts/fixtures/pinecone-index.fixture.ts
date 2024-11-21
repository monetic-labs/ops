import { PineconeRecord } from "@/libs/pinecone/types";

import { mockUsagePattern } from "./usage.fixture";
import { mockSpeedPreference } from "./preference.fixture";

export const mockPineconeConfig = {
  indexName: "test-fintech-knowledge",
  dimension: 1536, // OpenAI embedding dimension
  metric: "cosine",
  environment: "test",
};

export const mockPineconeRecords: PineconeRecord[] = [
  {
    id: "preference-speed-1",
    values: new Array(1536).fill(0), // Mock embedding
    metadata: {
      type: "preference",
      preference_type: "speed_vs_cost",
      content: JSON.stringify(mockSpeedPreference),
      domains: ["bill-pay"],
      capabilities: ["transfers"],
    },
  },
  {
    id: "usage-transfer-1",
    values: new Array(1536).fill(0),
    metadata: {
      type: "usage",
      content: JSON.stringify(mockUsagePattern),
      capabilities: ["transfers"],
    },
  },
];

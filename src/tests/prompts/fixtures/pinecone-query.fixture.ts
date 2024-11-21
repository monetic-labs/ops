import { mockSpeedPreference } from "./preference.fixture";
import { mockUsagePattern } from "./usage.fixture";

export const mockQueryResults = {
  matches: [
    {
      id: "preference-speed-1",
      score: 0.95,
      values: new Array(1536).fill(0),
      metadata: {
        type: "preference",
        preference_type: "speed_vs_cost",
        content: JSON.stringify(mockSpeedPreference),
      },
    },
    {
      id: "usage-transfer-1",
      score: 0.85,
      values: new Array(1536).fill(0),
      metadata: {
        type: "usage",
        intent: "quick_transfer",
        content: JSON.stringify(mockUsagePattern),
      },
    },
  ],
  namespace: "preferences",
};

import { SpeedOverCostPreference } from "@/prompts/v0/types";

export const mockSpeedPreference: SpeedOverCostPreference = {
  goal: "optimize_for_speed",
  preference_type: "speed_vs_cost",
  context: {
    domains: ["bill-pay"],
    capabilities: ["transfers"],
    priority: "speed",
  },
  parameters: {
    cost_tolerance: {
      max_premium_percentage: 2.5,
      max_premium_absolute: 25.0,
      currency: "USD",
    },
    speed_expectations: {
      target_completion_time: "1_minute",
      max_acceptable_time: "3_minutes",
    },
  },
  decision_rules: [
    {
      condition: "transaction_amount <= 1000",
      action: "always_choose_fastest",
      max_fee: 15.0,
    },
  ],
  override_triggers: [],
};

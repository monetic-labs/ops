import { DecisionRule, OverrideTrigger } from "@/prompts/v0/types";

export const mockDecisionRules: DecisionRule[] = [
  {
    condition: "transaction_amount <= 1000",
    action: "always_choose_fastest",
    max_fee: 15.0,
  },
  {
    condition: "transaction_amount > 1000 && <= 5000",
    action: "evaluate_fee_threshold",
    max_fee_percentage: 1.5,
  },
];

export const mockOverrideTriggers: OverrideTrigger[] = [
  {
    trigger: "unusual_amount",
    action: "force_user_confirmation",
    threshold: "200% of average",
    message: "This amount is higher than usual",
  },
];

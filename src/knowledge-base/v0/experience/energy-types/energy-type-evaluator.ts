import { evaluateTransferMethod } from "@/knowledge-base/v0/experience/preferences/preference-evaluator";

import { SpeedOverCostPreference, TransactionContext, TransferMethod } from "../../types";

import { EnergyTypePreference } from "./energy-type";

export function evaluateWithEnergyType(
  context: TransactionContext,
  energyType: EnergyTypePreference,
  basePreferences: SpeedOverCostPreference
): TransferMethod {
  const adjustedPreferences = adjustPreferencesByEnergyType(basePreferences, energyType);

  // For Reflectors, enforce waiting period for large transactions
  if (energyType.profile.type === "reflector" && context.amount > context.userHistory.averageTransaction) {
    return enforceWaitingPeriod(context, adjustedPreferences);
  }

  // For Manifestors, allow higher risk tolerance
  if (energyType.profile.type === "manifestor") {
    return evaluateWithHigherRiskTolerance(context, adjustedPreferences);
  }

  // Default to standard evaluation
  return evaluateTransferMethod(context, adjustedPreferences);
}

function adjustPreferencesByEnergyType(
  basePreferences: SpeedOverCostPreference,
  energyType: EnergyTypePreference
): SpeedOverCostPreference {
  return {
    ...basePreferences,
    parameters: {
      ...basePreferences.parameters,
      cost_tolerance: {
        ...basePreferences.parameters.cost_tolerance,
        max_premium_percentage:
          basePreferences.parameters.cost_tolerance.max_premium_percentage * energyType.feature_weights.risk_tolerance,
      },
      speed_expectations: {
        ...basePreferences.parameters.speed_expectations,
        target_completion_time: adjustCompletionTime(
          basePreferences.parameters.speed_expectations.target_completion_time,
          energyType
        ),
      },
    },
  };
}

function enforceWaitingPeriod(context: TransactionContext, preferences: SpeedOverCostPreference): TransferMethod {
  const { userHistory, availableMethods } = context;

  // For Reflectors: implement 28-day lunar cycle awareness
  const lastSimilarTransaction = userHistory.recentTransactions?.find(
    (tx) => Math.abs(tx.amount - context.amount) / context.amount < 0.2 // Within 20% of current amount
  );

  // If similar transaction exists, check if within lunar cycle (28 days)
  if (lastSimilarTransaction) {
    const daysSinceLastTransaction = Math.floor(
      (Date.now() - new Date(lastSimilarTransaction.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );

    // If within lunar cycle, use previous method
    if (daysSinceLastTransaction <= 28) {
      const previousMethod = availableMethods.find((m) => m.name === lastSimilarTransaction.method);

      if (previousMethod) return previousMethod;
    }
  }

  // Default to slowest but safest method if no previous reference
  return availableMethods.sort((a, b) => b.speed - a.speed)[0];
}

function evaluateWithHigherRiskTolerance(
  context: TransactionContext,
  preferences: SpeedOverCostPreference
): TransferMethod {
  // For Manifestors: implement bold decision-making
  const { availableMethods, amount } = context;

  // Increase risk tolerance by reducing confirmation requirements
  const adjustedPreferences: SpeedOverCostPreference = {
    ...preferences,
    parameters: {
      ...preferences.parameters,
      cost_tolerance: {
        ...preferences.parameters.cost_tolerance,
        max_premium_percentage: preferences.parameters.cost_tolerance.max_premium_percentage * 1.5,
        max_premium_absolute: preferences.parameters.cost_tolerance.max_premium_absolute * 1.5,
      },
    },
    decision_rules: preferences.decision_rules.map((rule) => ({
      ...rule,
      // Increase thresholds for user confirmation
      condition: rule.condition.includes("5000")
        ? rule.condition.replace("5000", "7500") // 50% higher threshold
        : rule.condition,
    })),
  };

  return evaluateTransferMethod(context, adjustedPreferences);
}

function adjustCompletionTime(baseTime: string, energyType: EnergyTypePreference): string {
  // Convert base time string to minutes
  const baseMinutes = parseInt(baseTime.replace("_minutes", ""));

  // Apply energy type specific multipliers
  const adjustedMinutes = Math.round(baseMinutes * energyType.feature_weights.speed);

  // Apply type-specific adjustments
  switch (energyType.profile.type) {
    case "manifestor":
      // Manifestors prefer immediate action
      return `${Math.max(1, adjustedMinutes - 1)}_minutes`;

    case "builder":
      // Generators need response time
      return `${adjustedMinutes + 2}_minutes`;

    case "projector":
      // Projectors need recognition time
      return `${adjustedMinutes + 1}_minutes`;

    case "reflector":
      // Reflectors need lunar cycle awareness
      return `${adjustedMinutes + 5}_minutes`;

    default:
      return `${adjustedMinutes}_minutes`;
  }
}

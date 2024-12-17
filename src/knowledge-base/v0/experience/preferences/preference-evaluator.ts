import { TransactionContext, SpeedOverCostPreference, TransferMethod, Override } from "@/knowledge-base/v0/types";

export function evaluateTransferMethod(
  context: TransactionContext,
  preferences: SpeedOverCostPreference
): TransferMethod {
  const { amount, availableMethods } = context;

  // Find applicable decision rule
  const rule = preferences.decision_rules.find((rule) => evaluateCondition(rule.condition, amount));

  // Filter methods based on speed expectations
  const viableMethods = availableMethods.filter(
    (method) => method.speed <= parseInt(preferences.parameters.speed_expectations.max_acceptable_time)
  );

  // Apply decision rule
  switch (rule?.action) {
    case "always_choose_fastest":
      return getFastestMethodWithinFeeLimit(viableMethods, rule.max_fee || 0);

    case "evaluate_fee_threshold":
      return getOptimalMethodByFeePercentage(viableMethods, amount, rule.max_fee_percentage || 0);

    case "prompt_user_confirmation":
      return suggestMethodWithConfirmation(
        viableMethods,
        preferences.parameters.cost_tolerance,
        amount // Pass the amount from context
      );

    default:
      return getDefaultMethod(viableMethods);
  }
}

export function checkOverrideTriggers(
  context: TransactionContext,
  preferences: SpeedOverCostPreference
): Override | null {
  const { amount, userHistory } = context;

  // Check for unusual amount
  if (amount > userHistory.averageTransaction * 2) {
    return {
      type: "unusual_amount",
      action: "force_user_confirmation",
      message: `This amount is significantly higher than your usual transactions`,
    };
  }

  return null;
}

// Helper functions for evaluating conditions and methods
function evaluateCondition(condition: string, amount: number): boolean {
  // Parse and evaluate condition strings like "transaction_amount <= 1000"
  const normalizedCondition = condition
    .replace("transaction_amount", amount.toString())
    .replace("<= ", "<=")
    .replace(">= ", ">=");

  try {
    return new Function(`return ${normalizedCondition}`)();
  } catch (error) {
    console.error("Error evaluating condition:", error);

    return false;
  }
}

function getFastestMethodWithinFeeLimit(methods: TransferMethod[], maxFee: number): TransferMethod {
  const validMethods = methods.filter((method) => {
    if (method.feeType === "flat") {
      return method.fee <= maxFee;
    }

    // For percentage fees, we need to calculate the actual fee amount
    return method.fee <= maxFee;
  });

  return validMethods.sort((a, b) => a.speed - b.speed)[0];
}

function getOptimalMethodByFeePercentage(
  methods: TransferMethod[],
  amount: number,
  maxFeePercentage: number
): TransferMethod {
  const validMethods = methods.filter((method) => {
    const effectiveFee = method.feeType === "percentage" ? (method.fee / 100) * amount : method.fee;
    const effectivePercentage = (effectiveFee / amount) * 100;

    return effectivePercentage <= maxFeePercentage;
  });

  // Sort by speed first, then by fee
  return validMethods.sort((a, b) => {
    if (Math.abs(a.speed - b.speed) <= 1) {
      // If speeds are within 1 minute
      return a.fee - b.fee; // Choose cheaper option
    }

    return a.speed - b.speed; // Otherwise choose faster option
  })[0];
}

function suggestMethodWithConfirmation(
  methods: TransferMethod[],
  costTolerance: SpeedOverCostPreference["parameters"]["cost_tolerance"],
  transactionAmount: number // Add transaction amount as parameter
): TransferMethod {
  const sortedMethods = methods.sort((a, b) => a.speed - b.speed);
  const fastestMethod = sortedMethods[0];

  // Check if fastest method exceeds cost tolerance
  const effectiveFee =
    fastestMethod.feeType === "percentage" ? (fastestMethod.fee / 100) * transactionAmount : fastestMethod.fee;

  if (effectiveFee > costTolerance.max_premium_absolute) {
    // Find next best method within tolerance
    return (
      sortedMethods.find((method) => {
        const fee = method.feeType === "percentage" ? (method.fee / 100) * transactionAmount : method.fee;

        return fee <= costTolerance.max_premium_absolute;
      }) || fastestMethod
    );
  }

  return fastestMethod;
}

function getDefaultMethod(methods: TransferMethod[]): TransferMethod {
  if (!methods.length) {
    throw new Error("No viable transfer methods available");
  }

  // Sort by balance of speed and cost
  return methods.sort((a, b) => {
    const aScore = a.speed * a.fee;
    const bScore = b.speed * b.fee;

    return aScore - bScore;
  })[0];
}

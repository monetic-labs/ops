// Preference evaluator types
export interface SpeedOverCostPreference {
  goal: string;
  preference_type: "speed_vs_cost";
  context: {
    domains: string[];
    capabilities: string[];
    priority: "speed" | "cost";
  };
  parameters: {
    cost_tolerance: {
      max_premium_percentage: number;
      max_premium_absolute: number;
      currency: string;
    };
    speed_expectations: {
      target_completion_time: string;
      max_acceptable_time: string;
    };
  };
  decision_rules: DecisionRule[];
  override_triggers: OverrideTrigger[];
}

export interface DecisionRule {
  condition: string;
  action: "always_choose_fastest" | "evaluate_fee_threshold" | "prompt_user_confirmation";
  max_fee?: number;
  max_fee_percentage?: number;
  threshold?: string;
}

export interface OverrideTrigger {
  trigger: string;
  action: string;
  threshold?: string;
  message?: string;
}

export interface Override {
  type: string;
  action: string;
  message: string;
}

export interface TransactionHistory {
  averageTransaction: number;
  recentTransactions?: {
    amount: number;
    method: string;
    timestamp: string;
    speed: number;
    fee: number;
  }[];
  patterns?: {
    preferredMethod?: string;
    typicalTimeOfDay?: string;
    averageFrequency?: number; // in days
    commonRecipients?: string[];
  };
  limits?: {
    daily: number;
    monthly: number;
    remaining: {
      daily: number;
      monthly: number;
    };
  };
  stats?: {
    totalTransactions: number;
    totalVolume: number;
    averageFee: number;
    averageSpeed: number;
  };
}

export interface TransactionContext {
  amount: number;
  availableMethods: TransferMethod[];
  userHistory: TransactionHistory;
}

export interface TransferMethod {
  name: string;
  speed: number; // in minutes
  fee: number;
  feeType: "flat" | "percentage";
}

export interface SpeechPattern {
  pattern: string;
  type: "user" | "agent";
}

export interface GreetingContext {
  type: "user" | "agent";
  script: {
    part_1: string;
    part_2?: string;
    part_3?: string;
  };
}

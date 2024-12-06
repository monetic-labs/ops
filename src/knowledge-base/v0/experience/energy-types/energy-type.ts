export interface EnergyTypeProfile {
  type: "manifestor" | "builder" | "manifesting_generator" | "projector" | "reflector";
  traits: string[];
  financial_strengths: string[];
  financial_challenges: string[];
  decision_style: {
    speed_multiplier: number;
    risk_tolerance: "low" | "medium" | "high";
    waiting_period: "minimal" | "response-based" | "recognition-based" | "lunar-cycle";
    confirmation_threshold: "low" | "medium" | "high";
  };
  optimal_capabilities: string[];
}

export interface EnergyTypePreference {
  profile: EnergyTypeProfile;
  feature_weights: {
    speed: number; // Multiplier for speed-related decisions
    risk_tolerance: number; // Multiplier for risk tolerance
    collaboration: number; // Weight for collaborative features
    reflection_period: number; // Weight for waiting periods
  };
  context: {
    domains: string[];
    capabilities: string[];
  };
  override_triggers?: {
    lunar_cycle?: boolean; // Specifically for Reflectors
    response_required?: boolean; // For Generators
    invitation_needed?: boolean; // For Projectors
  };
}

// Builder type configuration
export const BUILDER_PROFILE: EnergyTypeProfile = {
  type: "builder",
  traits: [
    "Steady progress oriented",
    "Foundation focused",
    "Systematic approach",
    "Consistent execution",
    "Resource optimization",
  ],
  financial_strengths: [
    "Excellent at building sustainable systems",
    "Strong with regular savings habits",
    "Natural capacity for steady wealth building",
    "Efficient resource management",
    "Reliable long-term planning",
  ],
  financial_challenges: [
    "May miss spontaneous opportunities",
    "Can be overly cautious with changes",
    "Might stick too long with suboptimal systems",
  ],
  decision_style: {
    speed_multiplier: 0.8, // Slightly slower, more methodical
    risk_tolerance: "medium",
    waiting_period: "lunar-cycle", // Updated from response-based
    confirmation_threshold: "medium",
  },
  optimal_capabilities: ["automated-savings", "recurring-transfers", "cost-over-speed", "systematic-investment"],
};

// Builder preference configuration
export const BUILDER_PREFERENCE: EnergyTypePreference = {
  profile: BUILDER_PROFILE,
  feature_weights: {
    speed: 0.7, // Values consistency over speed
    risk_tolerance: 0.6, // Moderate risk approach
    collaboration: 0.9, // High value on consistent patterns
    reflection_period: 0.5, // Moderate reflection needs
  },
  context: {
    domains: ["account-services", "bill-pay"],
    capabilities: ["automated-savings", "recurring-transfers"],
  },
  override_triggers: {
    lunar_cycle: true, // Requires solid foundation before proceeding
  },
};

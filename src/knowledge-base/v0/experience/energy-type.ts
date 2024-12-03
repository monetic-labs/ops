export interface EnergyTypeProfile {
    type: "manifestor" | "generator" | "manifesting_generator" | "projector" | "reflector";
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
      speed: number;           // Multiplier for speed-related decisions
      risk_tolerance: number;  // Multiplier for risk tolerance
      collaboration: number;   // Weight for collaborative features
      reflection_period: number; // Weight for waiting periods
    };
    context: {
      domains: string[];
      capabilities: string[];
    };
    override_triggers?: {
      lunar_cycle?: boolean;   // Specifically for Reflectors
      response_required?: boolean; // For Generators
      invitation_needed?: boolean; // For Projectors
    };
  }
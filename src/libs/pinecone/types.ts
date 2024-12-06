export type PineconeMetadataType = "preference" | "usage" | "experience" | "domain" | "capability";

// Make metadata compatible with Pinecone's RecordMetadata type
export interface PineconeMetadata extends Record<string, any> {
  type: PineconeMetadataType;
  content: string;
  title?: string;
  category?: string;
  domains?: string[];
  capabilities?: string[];
  preference_type?: string;
  priority?: string;
  related_chunks?: string[];
  bootstrapVersion?: string;
  uploadedAt?: string;
  decision_style?: string; // Store as JSON string
  traits?: string[];
  financial_strengths?: string[];
  financial_challenges?: string[];
  energy_type?: string;
}

export interface PineconeRecord {
  id: string;
  values: number[];
  metadata: PineconeMetadata;
  score?: number;
}

export interface PineconeNamespaceStats {
  vectorCount: number;
  dimensions: number;
}

export interface PineconeIndexStats {
  namespaces: Record<string, PineconeNamespaceStats>;
  dimension: number;
  indexFullness: number;
  totalVectorCount: number;
}

// Define specific types for structured metadata
export interface DecisionStyle {
  speed_multiplier: string; // Change to string to match Pinecone's requirements
  risk_tolerance: string;
  waiting_period: string;
  confirmation_threshold?: string;
}

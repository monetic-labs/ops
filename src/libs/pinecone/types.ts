export type PineconeMetadataType = "preference" | "usage" | "experience" | "domain" | "capability";

export interface PineconeMetadata {
  type: PineconeMetadataType;
  content: string;
  title?: string;
  category?: string;
  domains?: string[];
  capabilities?: string[];
  preference_type?: string;
  priority?: string;
  related_chunks?: string[];
}

export interface PineconeRecord {
  id: string;
  values: number[];
  metadata: PineconeMetadata;
  score?: number; // Used in query responses
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

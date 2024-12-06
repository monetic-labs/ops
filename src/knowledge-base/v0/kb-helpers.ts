import { PineconeMetadata } from "@/libs/pinecone/types";

export function formatMetadataForPinecone(metadata: any): PineconeMetadata {
  const formatted: PineconeMetadata = {
    type: metadata.type,
    content: metadata.content,
    capabilities: metadata.capabilities,
    domains: metadata.domains,
    related_chunks: metadata.related_chunks,
    bootstrapVersion: "v0",
    uploadedAt: new Date().toISOString(),
  };

  // Convert complex objects to strings
  if (metadata.decision_style) {
    formatted.decision_style = JSON.stringify(metadata.decision_style);
  }

  if (metadata.traits) {
    formatted.traits = metadata.traits;
  }

  if (metadata.financial_strengths) {
    formatted.financial_strengths = metadata.financial_strengths;
  }

  if (metadata.financial_challenges) {
    formatted.financial_challenges = metadata.financial_challenges;
  }

  if (metadata.energy_type) {
    formatted.energy_type = metadata.energy_type;
  }

  return formatted;
}

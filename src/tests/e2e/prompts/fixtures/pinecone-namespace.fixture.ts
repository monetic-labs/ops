export const mockPineconeNamespaces = {
  preferences: {
    vectorCount: 10,
    dimensions: 1536,
  },
  usage: {
    vectorCount: 15,
    dimensions: 1536,
  },
  experience: {
    vectorCount: 8,
    dimensions: 1536,
  },
};

export const mockNamespaceStats = {
  namespaces: mockPineconeNamespaces,
  dimension: 1536,
  indexFullness: 0.1,
  totalVectorCount: 33,
};

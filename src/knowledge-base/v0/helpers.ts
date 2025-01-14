export function findAdminCapabilities(graph: any) {
  return graph.nodes.filter((node: any) => node.requires?.includes("admin-access"));
}

export function getDomainCapabilities(graph: any, domainName: string) {
  return graph.edges
    .filter((edge: any) => edge.from === domainName && edge.relationship === "provides")
    .map((edge: any) => graph.nodes[edge.to]);
}

export function formatDomainCapabilitiesJSON(graph: any, domainName: string) {
  const capabilities = getDomainCapabilities(graph, domainName);

  return {
    domain: domainName,
    totalCapabilities: capabilities.length,
    capabilities: capabilities.map((cap: any) => ({
      name: cap.ui_component.replace(/-/g, " ").replace("tab", "").trim(),
      description: cap.description,
      requires: cap.requires.join(", "),
    })),
  };
}

export function formatDomainCapabilitiesString(graph: any, domainName: string) {
  const capabilities = getDomainCapabilities(graph, domainName);

  return `
        Domain: ${domainName}
        Total Capabilities: ${capabilities.length}

        Capabilities:
        ${capabilities
          .map(
            (cap: any) => `
        • ${cap.ui_component.replace(/-/g, " ").replace("tab", "").trim()}
        Description: ${cap.description}
        Requirements: ${cap.requires.join(", ")}
        `
          )
          .join("\n")}
            `.trim();
}

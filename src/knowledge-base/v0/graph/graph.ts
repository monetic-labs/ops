export interface User {
  id: string;
  role: string;
  permissions: string[];
}

export interface GraphNode {
  type: "domain" | "capability" | "system" | "permission" | "experience";
  description: string;
  requires?: string[];
  ui_component?: string;
  roles?: string[];
  // Add energy type specific fields for experience nodes
  traits?: string[];
  financial_strengths?: string[];
  financial_challenges?: string[];
  decision_style?: {
    speed_multiplier: number;
    risk_tolerance: "low" | "medium" | "high";
    waiting_period: "minimal" | "foundation-based" | "recognition-based" | "lunar-cycle";
    confirmation_threshold: "low" | "medium" | "high";
  };
  optimal_capabilities?: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  relationship: "provides" | "uses" | "manages" | "requires";
}

export interface Graph {
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
}

export function findAdminCapabilities(graph: Graph) {
  return Object.values(graph.nodes).filter((node: GraphNode) => node.requires?.includes("admin-access"));
}

export function getDomainCapabilities(graph: Graph, domainName: string) {
  return graph.edges
    .filter((edge: GraphEdge) => edge.from === domainName && edge.relationship === "provides")
    .map((edge: GraphEdge) => graph.nodes[edge.to]);
}

export function formatDomainCapabilitiesJSON(graph: Graph, domainName: string) {
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

export function formatDomainCapabilitiesString(graph: Graph, domainName: string) {
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

export function getRequiredPermissions(graph: Graph, capability: string, visited: Set<string> = new Set()): string[] {
  const node = graph.nodes[capability];

  if (!node || visited.has(capability)) return [];

  visited.add(capability);

  // Get direct permissions
  const directPermissions = node.requires || [];

  // Get permissions from required capabilities
  const requiredCapabilities = graph.edges
    .filter((edge) => edge.from === capability && edge.relationship === "requires")
    .map((edge) => edge.to);

  const inheritedPermissions = requiredCapabilities.flatMap((cap) => getRequiredPermissions(graph, cap, visited));

  // Get permissions from permission nodes
  const permissionNodes = graph.edges
    .filter((edge) => edge.from === capability && edge.relationship === "requires")
    .map((edge) => graph.nodes[edge.to])
    .filter((node) => node?.type === "permission")
    .map((node) => node.roles || [])
    .flat();

  return Array.from(new Set([...directPermissions, ...inheritedPermissions, ...permissionNodes]));
}

export function findRelatedFeatures(
  graph: Graph,
  capability: string
): {
  provides: string[];
  uses: string[];
  requires: string[];
} {
  const validateEdge = (edge: GraphEdge): boolean => {
    if (!graph.nodes[edge.to]) {
      console.warn(`Invalid edge detected: Node ${edge.to} does not exist`);

      return false;
    }

    return true;
  };

  return {
    provides: graph.edges
      .filter((edge) => edge.from === capability && edge.relationship === "provides" && validateEdge(edge))
      .map((edge) => edge.to),
    uses: graph.edges
      .filter((edge) => edge.from === capability && edge.relationship === "uses" && validateEdge(edge))
      .map((edge) => edge.to),
    requires: graph.edges
      .filter((edge) => edge.from === capability && edge.relationship === "requires" && validateEdge(edge))
      .map((edge) => edge.to),
  };
}

export function getCapabilityPath(graph: Graph, from: string, to: string): string[] | null {
  const visited = new Set<string>();
  const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }];

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (node === to) return path;

    if (!visited.has(node)) {
      visited.add(node);

      const edges = graph.edges.filter((edge) => edge.from === node);

      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          queue.push({
            node: edge.to,
            path: [...path, edge.to],
          });
        }
      }
    }
  }

  return null;
}

export function validateUserAccess(
  graph: Graph,
  user: User,
  capability: string
): {
  hasAccess: boolean;
  missingPermissions: string[];
} {
  const requiredPermissions = getRequiredPermissions(graph, capability);
  const missingPermissions = requiredPermissions.filter((permission) => !user.permissions.includes(permission));

  return {
    hasAccess: missingPermissions.length === 0,
    missingPermissions,
  };
}

// New helpers for experience/preference integration
export function getCapabilitiesByPreference(
  graph: Graph,
  preferenceType: string,
  context: {
    priority: string;
    parameters: Record<string, any>;
  }
): string[] {
  const relevantNodes = Object.entries(graph.nodes)
    .filter(([_, node]) => node.type === "capability")
    .map(([key, _]) => key);

  return relevantNodes.filter((nodeKey) => {
    const node = graph.nodes[nodeKey];

    switch (preferenceType) {
      case "speed_vs_cost":
        // Check if node has any required permissions
        if (!node.requires?.length) return false;

        // For speed priority, include basic capabilities and those matching user permissions
        if (context.priority === "speed") {
          // Include both simple and admin capabilities
          return node.requires.includes("user-auth") || node.requires.includes("admin-access");
        }

        // For cost priority, include all capabilities
        if (context.priority === "cost") {
          return true;
        }

        return false;
      default:
        return false;
    }
  });
}

export function findAlternativeCapabilities(
  graph: Graph,
  capability: string,
  context: {
    preferenceType?: string;
    parameters?: Record<string, any>;
  }
): string[] {
  const node = graph.nodes[capability];

  if (!node) return [];

  // Find capabilities with similar requirements
  const similarCapabilities = Object.entries(graph.nodes)
    .filter(
      ([key, compareNode]) =>
        key !== capability &&
        compareNode.type === "capability" &&
        compareNode.requires?.some((req) => node.requires?.includes(req))
    )
    .map(([key, _]) => key);

  // If preference context is provided, filter by preference
  if (context.preferenceType && context.parameters) {
    return similarCapabilities.filter((capKey) => {
      // Add preference-based filtering logic
      return true; // Placeholder
    });
  }

  return similarCapabilities;
}

export function validateCapabilityChain(
  graph: Graph,
  capabilities: string[],
  user: User
): {
  valid: boolean;
  missingPermissions: string[];
  invalidTransitions: string[];
} {
  const missingPermissions: string[] = [];
  const invalidTransitions: string[] = [];

  // Check permissions for each capability
  capabilities.forEach((capability) => {
    const { hasAccess, missingPermissions: missing } = validateUserAccess(graph, user, capability);

    if (!hasAccess) {
      missingPermissions.push(...missing);
    }
  });

  // Check valid transitions between capabilities
  for (let i = 0; i < capabilities.length - 1; i++) {
    const from = capabilities[i];
    const to = capabilities[i + 1];
    const path = getCapabilityPath(graph, from, to);

    if (!path) {
      invalidTransitions.push(`${from} -> ${to}`);
    }
  }

  return {
    valid: missingPermissions.length === 0 && invalidTransitions.length === 0,
    missingPermissions: Array.from(new Set(missingPermissions)),
    invalidTransitions,
  };
}

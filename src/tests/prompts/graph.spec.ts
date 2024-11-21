import { test, expect } from "@playwright/test";

import {
  getCapabilitiesByPreference,
  findAlternativeCapabilities,
  formatDomainCapabilitiesString,
  getRequiredPermissions,
  findRelatedFeatures,
  validateCapabilityChain,
  getCapabilityPath,
} from "@/prompts/v0/functions/graph";
import { Graph } from "@/prompts/v0/functions/graph";

import { mockGraph } from "./fixtures/graph.fixture";
import { mockSpeedPreference } from "./fixtures/preference.fixture";
import { mockAdminUser, mockUser } from "./fixtures/user.fixture";

test.describe("Graph Operations", () => {
  let graph: Graph;

  test.beforeEach(async () => {
    // Deep clone the mockGraph to prevent test pollution
    graph = JSON.parse(JSON.stringify(mockGraph));
  });

  test("should format domain capabilities string", async () => {
    const formattedString = formatDomainCapabilitiesString(graph, "bill-pay");

    await expect(formattedString).toContain("Domain: bill-pay");
    await expect(formattedString).toContain("Money transfer functionality");
    await expect(formattedString).toContain("Requirements: user-auth");
  });

  test("should get required permissions for capability", async () => {
    const permissions = getRequiredPermissions(graph, "transfers");

    await expect(permissions).toContain("user-auth");
    await expect(permissions.length).toBe(1);
  });

  test("should find related features for capability", async () => {
    const related = findRelatedFeatures(graph, "transfers");

    await expect(related.requires).toHaveLength(0);
    await expect(related.provides).toHaveLength(0);
    await expect(related.uses).toHaveLength(0);
  });

  test("should find capabilities by speed preference", async () => {
    const capabilities = getCapabilitiesByPreference(graph, "speed_vs_cost", {
      priority: "speed",
      parameters: mockSpeedPreference.parameters,
    });

    await expect(capabilities).toContain("transfers");
  });

  test("should find alternative capabilities", async () => {
    const alternatives = findAlternativeCapabilities(graph, "transfers", {
      preferenceType: "speed_vs_cost",
      parameters: mockSpeedPreference.parameters,
    });

    await expect(Array.isArray(alternatives)).toBeTruthy();
  });

  test("should validate graph structure", async () => {
    await expect(graph.nodes["transfers"]).toBeDefined();
    await expect(graph.nodes["bill-pay"]).toBeDefined();
    await expect(graph.edges).toHaveLength(1);
    await expect(graph.edges[0].relationship).toBe("provides");
  });

  // Error Cases
  test("should handle non-existent nodes gracefully", async () => {
    const permissions = getRequiredPermissions(graph, "non-existent");

    await expect(permissions).toEqual([]);

    const related = findRelatedFeatures(graph, "non-existent");

    await expect(related.provides).toEqual([]);
    await expect(related.uses).toEqual([]);
    await expect(related.requires).toEqual([]);
  });

  test("should handle malformed graph data", async () => {
    const malformedGraph: Graph = {
      nodes: {
        "broken-node": {
          type: "capability",
          description: "Broken capability",
          // Missing required fields
        },
      },
      edges: [],
    };

    const formatted = formatDomainCapabilitiesString(malformedGraph, "broken-node");

    await expect(formatted).toContain("Domain: broken-node");
  });

  // Permission Hierarchy
  test("should validate user permissions against capabilities", async () => {
    // Add test capabilities
    graph.nodes["admin-transfers"] = {
      type: "capability",
      description: "Administrative transfer controls",
      requires: ["admin-access"],
      ui_component: "admin-transfers-tab",
    };

    graph.nodes["user-transfers"] = {
      type: "capability",
      description: "User transfer controls",
      requires: ["user-auth"],
      ui_component: "user-transfers-tab",
    };

    const preferenceContext = {
      priority: "speed",
      parameters: mockSpeedPreference.parameters,
    };

    // Get capabilities filtered by preference first
    const availableCapabilities = getCapabilitiesByPreference(graph, "speed_vs_cost", preferenceContext);

    // Then filter by user permissions
    const standardUserCaps = availableCapabilities.filter((cap) => {
      const permissions = getRequiredPermissions(graph, cap);

      return permissions.every((perm) => mockUser.permissions.includes(perm));
    });

    const adminUserCaps = availableCapabilities.filter((cap) => {
      const permissions = getRequiredPermissions(graph, cap);

      return permissions.every((perm) => mockAdminUser.permissions.includes(perm));
    });

    await expect(standardUserCaps.length).toBeLessThan(adminUserCaps.length);
  });

  // Edge Relationships
  test("should validate edge relationship integrity", async () => {
    // Setup console warning spy
    const warnings: string[] = [];
    const originalWarn = console.warn;

    console.warn = (msg: string) => {
      warnings.push(msg);
    };

    const invalidEdge = {
      from: "transfers",
      to: "non-existent",
      relationship: "provides" as const,
    };

    graph.edges.push(invalidEdge);
    const related = findRelatedFeatures(graph, "transfers");

    // Test both the edge filtering and node existence
    await expect(related.provides).toEqual([]);
    await expect(warnings).toContain("Invalid edge detected: Node non-existent does not exist");

    // Cleanup
    console.warn = originalWarn;
  });

  // Capability Chains
  test("should handle multi-level capability requirements", async () => {
    // Add a capability that requires both transfers and premium access
    graph.nodes["premium-transfers"] = {
      type: "capability",
      description: "Premium transfer service",
      requires: ["premium-access"], // Direct requirement
      ui_component: "premium-transfers-tab",
    };

    // Add the premium-access permission node
    graph.nodes["premium-access"] = {
      type: "permission",
      description: "Premium service access",
      roles: ["premium-user"],
      ui_component: "premium-badge",
    };

    graph.edges.push({
      from: "premium-transfers",
      to: "transfers",
      relationship: "requires",
    });

    const allRequirements = getRequiredPermissions(graph, "premium-transfers");

    // Should include both direct and inherited requirements
    await expect(allRequirements).toContain("premium-access");
    await expect(allRequirements).toContain("user-auth");
    await expect(allRequirements.length).toBe(2);
  });

  // Performance Tests
  test("should handle large graph operations efficiently", async () => {
    // Generate a large graph
    const largeGraph: Graph = {
      nodes: {},
      edges: [],
    };

    // Add 1000 nodes
    for (let i = 0; i < 1000; i++) {
      const nodeId = `node-${i}`;

      largeGraph.nodes[nodeId] = {
        type: "capability",
        description: `Test node ${i}`,
        requires: ["user-auth"],
        ui_component: `test-${i}-tab`,
      };
    }

    // Add 2000 edges
    for (let i = 0; i < 1000; i++) {
      largeGraph.edges.push({
        from: `node-${i}`,
        to: `node-${(i + 1) % 1000}`,
        relationship: "requires",
      });
      largeGraph.edges.push({
        from: `node-${i}`,
        to: `node-${(i + 2) % 1000}`,
        relationship: "uses",
      });
    }

    const start = performance.now();

    // Test traversal performance
    const path = getCapabilityPath(largeGraph, "node-0", "node-999");
    const validation = validateCapabilityChain(largeGraph, ["node-0", "node-500", "node-999"], mockUser);

    const end = performance.now();
    const executionTime = end - start;

    await expect(path).toBeDefined();
    await expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
  });

  // Complex Traversal Tests
  test("should handle complex capability chains", async () => {
    // Create a complex chain of capabilities
    graph.nodes["auth"] = {
      type: "capability",
      description: "Authentication",
      requires: ["user-auth"],
      ui_component: "auth-tab",
    };

    graph.nodes["premium"] = {
      type: "capability",
      description: "Premium features",
      requires: ["auth", "payment"],
      ui_component: "premium-tab",
    };

    graph.edges.push(
      { from: "auth", to: "premium", relationship: "provides" },
      { from: "premium", to: "transfers", relationship: "uses" }
    );

    const traversalResults = await Promise.all([
      getCapabilityPath(graph, "auth", "transfers"),
      validateCapabilityChain(graph, ["auth", "premium", "transfers"], mockUser),
    ]);

    await expect(traversalResults[0]).toBeDefined();
    await expect(traversalResults[0]?.length).toBeGreaterThan(1);
    await expect(traversalResults[1].invalidTransitions).toHaveLength(0);
  });
});

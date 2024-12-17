import path from "path";
import fs from "fs";

import matter from "gray-matter";

import { Graph } from "@/knowledge-base/v0/graph/graph";
import { UsagePattern } from "@/knowledge-base/v0/usage";

/**
 * Represents a processed document with content and metadata
 */
export type ProcessedDocument = {
  content: string;
  category: string;
  title: string;
  metadata: Record<string, any>;
};

/**
 * Extends ProcessedDocument with additional fields for prompt-specific documents
 */
export interface PromptDocument extends ProcessedDocument {
  type: "graph" | "usage" | "experience" | "preference";
  relationships?: string[];
  context?: Record<string, any>;
}

/**
 * Processes usage pattern files and validates them against the graph structure
 * @param usageDir - Directory containing usage pattern JSON files
 * @param graph - Graph instance for capability validation
 * @returns Array of processed PromptDocuments
 */
export async function processUsagePatterns(usageDir: string, graph: Graph): Promise<PromptDocument[]> {
  const documents: PromptDocument[] = [];
  const files = fs.readdirSync(usageDir).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const content = fs.readFileSync(path.join(usageDir, file), "utf-8");
    const pattern: UsagePattern = JSON.parse(content);

    // Validate capabilities against graph
    const validCapabilities = pattern.capabilities.every(
      (cap) => graph.nodes[cap] && graph.nodes[cap].type === "capability"
    );

    if (!validCapabilities) {
      console.warn(`Invalid capabilities in usage pattern: ${file}`);
      continue;
    }

    // Create structured content for embedding
    const structuredContent = {
      intent: pattern.intent,
      capabilities: pattern.capabilities.map((cap) => ({
        name: cap,
        description: graph.nodes[cap].description,
      })),
      flow: pattern.agent_relations.map((d) => ({
        user: d.user,
        system: d.agent,
      })),
      edge_cases: pattern.edge_cases,
    };

    documents.push({
      type: "usage",
      content: JSON.stringify(structuredContent),
      category: "usage-patterns",
      title: pattern.intent,
      metadata: {
        capabilities: pattern.capabilities,
        context_requirements: pattern.context,
      },
    });
  }

  return documents;
}

export async function processExperiencePreferences(experienceDir: string, graph: Graph): Promise<PromptDocument[]> {
  const documents: PromptDocument[] = [];
  const files = fs.readdirSync(experienceDir).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const content = fs.readFileSync(path.join(experienceDir, file), "utf-8");
    const preference = JSON.parse(content);

    if (file === "speed-over-cost.json") {
      // Reference to SpeedOverCostPreference type
      // Lines 2-23 in types.ts
      const structuredContent = {
        goal: preference.goal,
        user_intent: preference.user_intent,
        context: {
          domains: preference.context.domains.map((domain: string) => ({
            name: domain,
            description: graph.nodes[domain]?.description,
          })),
          capabilities: preference.context.capabilities,
        },
        parameters: preference.parameters,
        decision_rules: preference.decision_rules,
      };

      documents.push({
        type: "preference",
        content: JSON.stringify(structuredContent),
        category: "user-preferences",
        title: preference.goal,
        metadata: {
          preference_type: preference.preference_type,
          domains: preference.context.domains,
          capabilities: preference.context.capabilities,
          priority: preference.context.priority,
        },
      });
    } else {
      // Handle regular experience/goal documents
      // Reference to UserGoal type
      // Lines 1-6 in experience/index.ts
      const structuredContent = {
        goal: preference.goal,
        user_intent: preference.user_intent,
        success_metrics: preference.success_metrics,
        capabilities: preference.capabilities_needed?.map((cap: string) => ({
          name: cap,
          description: graph.nodes[cap]?.description,
        })),
      };

      documents.push({
        type: "experience",
        content: JSON.stringify(structuredContent),
        category: "user-goals",
        title: preference.goal,
        metadata: {
          capabilities_needed: preference.capabilities_needed,
          success_criteria: preference.success_metrics,
        },
      });
    }
  }

  return documents;
}

export async function processPromptStructure(graph: Graph, docsDir: string): Promise<PromptDocument[]> {
  const documents: PromptDocument[] = [];

  // Process graph structure
  const graphDoc = processGraphStructure(graph);

  documents.push(graphDoc);

  // Process usage patterns
  const usagePatterns = await processUsagePatterns(docsDir + "/usage", graph);

  documents.push(...usagePatterns);

  // Process experience preferences
  const experiences = await processExperiencePreferences(docsDir + "/experience", graph);

  documents.push(...experiences);

  return documents;
}

export function processGraphStructure(graph: Graph): PromptDocument {
  return {
    type: "graph",
    content: JSON.stringify(graph),
    category: "structure",
    title: "Product Graph Structure",
    metadata: {
      nodeCount: Object.keys(graph.nodes).length,
      edgeCount: graph.edges.length,
      domains: Object.values(graph.nodes)
        .filter((node) => node.type === "domain")
        .map((node) => node.description),
    },
  };
}

/**
 * Processes markdown files and extracts frontmatter metadata
 * @param filePath - Path to the markdown file
 * @returns ProcessedDocument or null if processing fails
 */
export function processMarkdownFile(filePath: string): ProcessedDocument | null {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    // Get category from directory structure if not in frontmatter
    const category = data.category || path.basename(path.dirname(filePath));

    return {
      content: content.trim(),
      category,
      title: data.title || path.basename(filePath, ".md"),
      metadata: data,
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);

    return null;
  }
}

/**
 * Recursively finds all markdown files in a directory and its subdirectories
 * @param dir - Root directory to start searching from
 * @returns Array of file paths for all found markdown files
 */
export function getAllMarkdownFiles(dir: string): string[] {
  let results: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively get files from subdirectories
      results = results.concat(getAllMarkdownFiles(fullPath));
    } else if (item.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Main document processing function that handles markdown files in a directory
 * @param docsDir - Directory containing documents to process
 * @returns Array of processed documents
 */
export async function processDocuments(docsDir: string): Promise<ProcessedDocument[]> {
  console.log(`Scanning directory: ${docsDir}`);

  const markdownFiles = getAllMarkdownFiles(docsDir);

  console.log(`Found ${markdownFiles.length} markdown files:`, markdownFiles);

  const documents = markdownFiles
    .map((filePath) => {
      const doc = processMarkdownFile(filePath);

      if (doc) {
        console.log(`Processed: ${doc.title} (${doc.category})`);
      }

      return doc;
    })
    .filter((doc): doc is ProcessedDocument => doc !== null);

  // Fix for Set spread operator issue
  const categories = Array.from(new Set(documents.map((doc) => doc.category)));

  console.log("Categories found:", categories);

  return documents;
}

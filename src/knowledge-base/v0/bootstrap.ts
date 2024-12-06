import { Graph } from "./graph/graph";
import { createImmutableGraph } from "./graph/graph-validation";
import { generateEmbeddings } from "./embedding";
import { chunkGraphData } from "./chunking";
import graphData from "./graph/graph.json";
import builderData from "./experience/energy-types/builder.json";
import manifestorData from "./experience/energy-types/manifestor.json";
import speedOverCostData from "./experience/preferences/speed-over-cost.json";
import costOverSpeedData from "./experience/preferences/cost-over-speed.json";

export async function bootstrapKnowledgeBase() {
  const embeddings = [];

  try {
    // 1. Load and validate graph structure - using direct import instead of dynamic
    console.log("Loading graph data...");
    const graph: Graph = createImmutableGraph(graphData as Graph);

    console.log("Graph loaded with", Object.keys(graph.nodes).length, "nodes");

    // 2. Generate embeddings for graph structure
    console.log("Generating graph structure embedding...");
    const graphEmbedding = await generateEmbeddings({
      type: "domain",
      content: JSON.stringify({
        description: "Core product graph structure",
        nodes: Object.keys(graph.nodes).length,
        edges: graph.edges.length,
      }),
      metadata: {
        type: "domain",
        id: "graph-structure",
        title: "Product Graph Structure",
        category: "system",
      },
    });

    embeddings.push(graphEmbedding);

    // 3. Process graph nodes into embeddings
    console.log("Chunking graph data...");
    const chunks = chunkGraphData(graph);

    console.log(`Generated ${chunks.length} chunks`);

    for (const chunk of chunks) {
      console.log(`Processing chunk of type: ${chunk.type}`);
      const embedding = await generateEmbeddings({
        type: chunk.type,
        content: chunk.content,
        metadata: {
          type: chunk.type,
          id: `chunk-${chunk.type}-${embeddings.length}`,
          title: `${chunk.type} chunk ${embeddings.length}`,
          category: "graph",
          related_chunks: chunk.related_chunks,
        },
      });

      embeddings.push(embedding);
    }

    // 4. Load and process energy types - using static imports
    const energyTypes = [builderData, manifestorData];

    for (const energyType of energyTypes) {
      if (!graph.nodes[energyType.id]) {
        console.error(`Energy type ${energyType.id} not found in graph`);
        continue;
      }

      const embedding = await generateEmbeddings({
        type: "experience",
        content: JSON.stringify(energyType),
        metadata: {
          type: "energy_type",
          id: energyType.id,
          title: energyType.type,
          category: "energy_type",
          capabilities: energyType.optimal_capabilities,
          traits: energyType.traits,
          decision_style: energyType.decision_style,
          related_chunks: graph.edges
            .filter((e) => e.from === energyType.id || e.to === energyType.id)
            .map((e) => (e.from === energyType.id ? e.to : e.from)),
        },
      });

      embeddings.push(embedding);
    }

    // 5. Process preferences - using static imports
    const preferences = [speedOverCostData, costOverSpeedData];

    for (const pref of preferences) {
      const embedding = await generateEmbeddings({
        type: "preference",
        content: JSON.stringify(pref),
        metadata: {
          type: "preference",
          id: pref.goal,
          title: pref.goal,
          category: "preference",
          related_chunks: pref.context.capabilities,
        },
      });

      embeddings.push(embedding);
    }

    console.log(`Generated ${embeddings.length} total embeddings`);

    return embeddings;
  } catch (error) {
    console.error("Error in bootstrapKnowledgeBase:", error);
    throw error;
  }
}

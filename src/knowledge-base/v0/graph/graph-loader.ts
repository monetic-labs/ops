import { Graph, GraphNode, GraphEdge } from './graph';
import graphData from './graph.json';

export async function loadGraph(): Promise<Graph> {
    try {
      const nodes: Record<string, GraphNode> = {};
      for (const [id, node] of Object.entries(graphData.nodes)) {
        if (!isValidGraphNode(node)) {
          console.warn(`Invalid node structure for ${id}:`, node);
          continue;
        }
        nodes[id] = node as GraphNode;
      }
  
      const edges: GraphEdge[] = [];
      for (const edge of graphData.edges) {
        if (!isValidGraphEdge(edge)) {
          console.warn('Invalid edge structure:', edge);
          continue;
        }
        if (!nodes[edge.from] || !nodes[edge.to]) {
          console.warn(`Edge references non-existent node: ${edge.from} -> ${edge.to}`);
          continue;
        }
        edges.push(edge as GraphEdge);
      }
  
      console.log(`Loaded graph with ${Object.keys(nodes).length} nodes and ${edges.length} edges`);
      return { nodes, edges };
    } catch (error) {
      console.error('Failed to load graph:', error);
      return { nodes: {}, edges: [] };
    }
  }

// Type guards for validation
function isValidGraphNode(node: any): node is GraphNode {
  return (
    node &&
    typeof node === 'object' &&
    'type' in node &&
    'description' in node &&
    typeof node.description === 'string' &&
    ['domain', 'capability', 'system', 'permission', 'experience'].includes(node.type)
  );
}

function isValidGraphEdge(edge: any): edge is GraphEdge {
  return (
    edge &&
    typeof edge === 'object' &&
    'from' in edge &&
    'to' in edge &&
    'relationship' in edge &&
    typeof edge.from === 'string' &&
    typeof edge.to === 'string' &&
    ['provides', 'uses', 'manages', 'requires', 'modifies'].includes(edge.relationship)
  );
}
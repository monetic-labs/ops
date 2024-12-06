import { useMemo } from "react";

import graphData from "@/knowledge-base/v0/graph/graph.json";

export const useMentions = () => {
  const options = useMemo(() => {
    // Get domains and capabilities from graph
    const nodes = Object.entries(graphData.nodes);

    console.log("Available Graph Nodes:", nodes.length);

    const filteredOptions = nodes.filter(([_, node]) => node.type === "domain" || node.type === "capability");

    console.log(
      "Filtered Mention Options:",
      filteredOptions.map(([id, node]) => ({
        id,
        type: node.type,
        description: node.description,
      }))
    );

    return filteredOptions.map(([id, node]) => ({
      id,
      value: id,
      label: id
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      description: node.description,
      type: node.type,
    }));
  }, []);

  return { options };
};

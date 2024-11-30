import { Graph } from "@/prompts/v0/functions/graph";

export const mockGraph: Graph = {
  nodes: {
    transfers: {
      type: "capability",
      description: "Money transfer functionality",
      requires: ["user-auth"],
      ui_component: "transfers-tab",
    },
    "bill-pay": {
      type: "domain",
      description: "Bill payment system",
      ui_component: "bill-pay.tsx",
    },
  },
  edges: [
    {
      from: "bill-pay",
      to: "transfers",
      relationship: "provides",
    },
  ],
};

import { ContextChunk } from "@/knowledge-base/v0/chunking";

export const mockContextChunks: ContextChunk[] = [
  {
    type: "domain",
    priority: 1,
    content: "Bill payment system for managing transfers",
    related_chunks: ["transfers", "user-auth"],
  },
  {
    type: "capability",
    priority: 2,
    content: "Fast transfer capability with premium fees",
    related_chunks: ["bill-pay", "user-auth"],
  },
  {
    type: "usage",
    priority: 3,
    content: "User frequently makes quick transfers in the morning",
    related_chunks: ["transfers"],
  },
];

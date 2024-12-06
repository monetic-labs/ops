import { NextResponse } from "next/server";

import { pinecone } from "@/libs/pinecone/pinecone";
import { KNOWLEDGE_BASE_CONFIG } from "@/knowledge-base/config";

// GET stats about the index
export async function GET() {
  try {
    const index = pinecone.index(KNOWLEDGE_BASE_CONFIG.index);
    const stats = await index.describeIndexStats();

    if (!stats.namespaces) {
      return NextResponse.json({
        totalDocuments: 0,
        namespaces: {},
        dimension: stats.dimension,
        indexFullness: 0,
      });
    }

    const namespaces = stats.namespaces;

    return NextResponse.json({
      totalDocuments: stats.totalRecordCount,
      namespaces: Object.entries(namespaces).reduce(
        (acc, [ns, data]) => ({
          ...acc,
          [ns]: { recordCount: data.recordCount },
        }),
        {}
      ),
      dimension: stats.dimension,
      indexFullness: stats.indexFullness,
    });
  } catch (error) {
    console.error("Failed to fetch Pinecone stats:", error);

    return NextResponse.json({ error: "Failed to fetch index stats" }, { status: 500 });
  }
}

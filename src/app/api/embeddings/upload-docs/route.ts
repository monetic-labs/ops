import { NextResponse } from "next/server";
import { pinecone } from "@/libs/pinecone/pinecone";
import { KNOWLEDGE_BASE_CONFIG } from "@/knowledge-base/config";
import { Graph, getDomainCapabilities } from "@/knowledge-base/v0/graph/graph";
import { loadGraph } from "@/knowledge-base/v0/graph/graph-loader";
import { getEmbedding } from "@/libs/openai/embedding";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const namespace = searchParams.get("namespace");

  try {
    const index = pinecone.index(KNOWLEDGE_BASE_CONFIG.index);
    const graph: Graph = await loadGraph();
    
    // Query Pinecone with metadata included
    const queryResponse = await index.query({
      filter: namespace ? { namespace } : undefined,
      includeMetadata: true,
      vector: new Array(KNOWLEDGE_BASE_CONFIG.dimension).fill(0),
      topK: 10000,
    });

    // Transform Pinecone matches into our DocumentList format with enhanced sections
    const documents = queryResponse.matches?.map(match => {
      let nodeId;
      try {
        // Ensure we're working with a string
        const contentStr = typeof match.metadata?.content === 'string' 
          ? match.metadata.content 
          : JSON.stringify(match.metadata?.content);
          
        // First parse to get the outer JSON object
        const outerContent = JSON.parse(contentStr);
        // Then parse the inner JSON string
        const parsedContent = JSON.parse(outerContent.content);
        nodeId = parsedContent.id;  // Extract the node ID
        console.log('Outer:', outerContent, 'Inner:', parsedContent, 'Node ID:', nodeId); // Enhanced debug log
      } catch (error) {
        console.warn('Failed to parse content:', match.metadata?.content, error);
        nodeId = match.id;
      }
    
      const node = graph.nodes[nodeId];
      console.log('Graph node lookup:', nodeId, node);
    
      let section = "No section";
    
      if (node) {
        if (node.type === "domain") {
          const capabilities = getDomainCapabilities(graph, nodeId);
          const capabilityNames = capabilities.map(cap => cap.description);
          section = `${node.description} providing: ${capabilityNames.join(', ') || 'no capabilities'}`;
        } else if (node.type === "capability") {
          const requirements = node.requires || [];
          const usedByNodes = graph.edges
            .filter(edge => edge.to === nodeId && edge.relationship === "uses")
            .map(edge => graph.nodes[edge.from]?.description);
    
          section = `${node.description}${
            requirements.length ? ` requiring: ${requirements.join(', ')}` : ''
          }${usedByNodes.length ? ` • Used by: ${usedByNodes.join(', ')}` : ''}`;
        }
      }

      return {
        id: match.id,
        metadata: {
          category: match.metadata?.type || "Uncategorized",
          section,
          text: match.metadata?.content || "No content available",
          created_at: match.metadata?.created_at || Date.now(),
          source: match.metadata?.source,
          label: node?.description || match.id,
          type: node?.type,
          ...match.metadata
        }
      };
    }) || [];

    return NextResponse.json({ documents });

  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST a new document to the index
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const content = await file.text();
    const category = (formData.get("category") as string) || "general";

    // Generate a unique document ID
    const documentId = `${category}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Process the document
    const doc = {
      content,
      category,
      title: file.name.replace(/\.[^/.]+$/, ""),
      metadata: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size,
        documentId,
        wordCount: content.split(/\s+/).length,
        charCount: content.length,
      },
    };

    const embedding = await getEmbedding(content);
    const index = pinecone.index("fintech-knowledge");

    await index.upsert([
      {
        id: documentId,
        values: embedding,
        metadata: {
          text: content,
          category,
          title: doc.title,
          ...doc.metadata,
        },
      },
    ]);

    // Get updated stats after upload
    const stats = await index.describeIndexStats();

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        title: doc.title,
        category,
        size: file.size,
        metadata: doc.metadata,
      },
      indexStats: {
        totalDocuments: stats.totalRecordCount,
        namespaces: stats.namespaces,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}

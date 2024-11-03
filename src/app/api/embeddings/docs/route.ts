import { NextResponse } from 'next/server';
import { processDocuments } from '@/libs/pinecone/processor';
import { pinecone } from '@/libs/pinecone/pinecone';
import { getEmbedding } from '@/libs/openai/embedding';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const namespace = searchParams.get('namespace');
    const index = pinecone.index('fintech-knowledge');

    // First get index stats for namespaces info
    const stats = await index.describeIndexStats();

    // Then fetch documents from the specified namespace
    const queryResponse = await (namespace ? 
      index.namespace(namespace) : 
      index
    ).query({
      topK: 10000, // Adjust based on your needs
      includeMetadata: true,
      vector: new Array(stats.dimension).fill(0), // Dummy vector to get all docs
    });

    return NextResponse.json({
      namespaces: stats.namespaces,
      documents: queryResponse.matches.map(match => ({
        id: match.id,
        metadata: match.metadata,
      })),
      totalDocuments: stats.totalRecordCount
    });
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list documents' },
      { status: 500 }
    );
  }
}

// POST a new document to the index
export async function POST(req: Request) {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
  
      const content = await file.text();
      const category = formData.get('category') as string || 'general';
      
      // Generate a unique document ID
      const documentId = `${category}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      // Process the document
      const doc = {
        content,
        category,
        title: file.name.replace(/\.[^/.]+$/, ''),
        metadata: {
          uploadedAt: new Date().toISOString(),
          fileType: file.type,
          fileSize: file.size,
          documentId,
          wordCount: content.split(/\s+/).length,
          charCount: content.length
        }
      };
  
      const embedding = await getEmbedding(content);
      const index = pinecone.index('fintech-knowledge');
      
      await index.upsert([{
        id: documentId,
        values: embedding,
        metadata: {
          text: content,
          category,
          title: doc.title,
          ...doc.metadata
        }
      }]);
  
      // Get updated stats after upload
      const stats = await index.describeIndexStats();
  
      return NextResponse.json({ 
        success: true,
        document: {
          id: documentId,
          title: doc.title,
          category,
          size: file.size,
          metadata: doc.metadata
        },
        indexStats: {
          totalDocuments: stats.totalRecordCount,
          namespaces: stats.namespaces
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Upload failed' },
        { status: 500 }
      );
    }
  }
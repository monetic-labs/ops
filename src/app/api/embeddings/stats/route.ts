import { NextResponse } from 'next/server';
import { pinecone } from '@/libs/server/pinecone';

// GET stats about the index
export async function GET() {
    try {
      const index = pinecone.index('fintech-knowledge');
      const stats = await index.describeIndexStats();
  
      // Get detailed namespace information
      const namespaceStats = stats.namespaces;
      const totalRecords = stats.totalRecordCount;
      const dimension = stats.dimension;
  
      return NextResponse.json({
        totalDocuments: totalRecords,
        dimension,
        namespaces: namespaceStats,
        indexFullness: stats.indexFullness
      });
  
    } catch (error) {
      console.error('Error fetching index stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch index statistics' },
        { status: 500 }
      );
    }
  }
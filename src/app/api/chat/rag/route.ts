import { NextResponse } from 'next/server';
import { RAGClient } from '@/libs/rag/client';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    const ragClient = new RAGClient();
    const response = await ragClient.query(message);

    return NextResponse.json({
      answer: response.text,
      sources: response.sources
    });
  } catch (error) {
    console.error('RAG processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process RAG query' }, 
      { status: 500 }
    );
  }
}
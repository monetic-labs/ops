import { NextResponse } from 'next/server';
import { pinecone } from '@/libs/server/pinecone';

export async function DELETE(req: Request) {
  try {
    const { namespace } = await req.json();
    const index = pinecone.index('fintech-knowledge');
    
    await index.deleteMany({
      deleteAll: true,
      namespace
    });

    return NextResponse.json({
      message: `All documents${namespace ? ` in namespace ${namespace}` : ''} deleted successfully`
    });
  } catch (error) {
    console.error('Delete all error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete all failed' },
      { status: 500 }
    );
  }
}
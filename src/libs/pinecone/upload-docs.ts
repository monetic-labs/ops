import { processDocuments } from '@/libs/pinecone/processor';
import { getEmbedding } from '@/libs/ai/embedding';
import { pinecone } from '@/libs/pinecone';
import path from 'path';

async function uploadDocs() {
  try {
    // Process all markdown files from the /docs directory
    const docsDir = path.join(process.cwd(), 'docs');
    const documents = await processDocuments(docsDir);
    
    console.log(`Processing ${documents.length} documents...`);
    
    const index = pinecone.index('fintech-knowledge');

    for (const doc of documents) {
      const embedding = await getEmbedding(doc.content);
      
      await index.upsert([{
        id: `${doc.category}-${Date.now()}`,
        values: embedding,
        metadata: {
            text: doc.content,
            category: doc.category,
            title: doc.title,
            ...doc.metadata
          }
      }]);
      
      console.log(`Uploaded: ${doc.title} (${doc.category})`);
    }

    console.log('Document upload complete!');
  } catch (error) {
    console.error('Error uploading documents:', error);
  }
}

uploadDocs();
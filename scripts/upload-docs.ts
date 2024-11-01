import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Verify environment variables are loaded
console.log('OpenAI Key present:', !!process.env.OPENAI_API_KEY);
console.log('Pinecone Key present:', !!process.env.PINECONE_API_KEY);

// Now import the rest of the modules
import { processDocuments } from '@/libs/pinecone/processor';
import { getEmbedding } from '@/libs/openai/embedding';
import { pinecone } from '@/libs/pinecone';

async function uploadDocs() {
  try {
    const docsDir = path.join(process.cwd(), 'src', 'docs');
    console.log(`Looking for documents in: ${docsDir}`);
    
    // Check if docs directory exists
    if (!fs.existsSync(docsDir)) {
      console.error(`Docs directory not found at: ${docsDir}`);
      process.exit(1);
    }

    // List all subdirectories for debugging
    const subdirs = fs.readdirSync(docsDir);
    console.log('Found directories:', subdirs);

    const documents = await processDocuments(docsDir);
    
    if (documents.length === 0) {
      console.log('No markdown files found in docs directory');
      process.exit(1);
    }
    
    console.log(`Processing ${documents.length} documents...`);
    
    const index = pinecone.index('fintech-knowledge');

    // Get initial stats
    const beforeStats = await index.describeIndexStats();
    console.log('Initial index stats:', beforeStats);

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

    // Get final stats to verify upload
    const afterStats = await index.describeIndexStats();
    console.log('Final index stats:', afterStats);
    
    console.log(`
    Upload Summary:
    - Initial record count: ${beforeStats.totalRecordCount ?? 0}
    - Final record count: ${afterStats.totalRecordCount ?? 0}
    - New records added: ${(afterStats.totalRecordCount ?? 0) - (beforeStats.totalRecordCount ?? 0)}
    `);

  } catch (error) {
    console.error('Error uploading documents:', error);
    process.exit(1);
  }
}

uploadDocs();
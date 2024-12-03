// import * as dotenv from 'dotenv';
// import path from 'path';
// import fs from 'fs';

// // Load environment variables
// dotenv.config();

// // Verify environment variables are loaded
// console.log('OpenAI Key present:', !!process.env.OPENAI_API_KEY);
// console.log('Pinecone Key present:', !!process.env.PINECONE_API_KEY);

// // Now import the rest of the modules
// import { processDocuments } from '@/libs/pinecone/processor';
// import { getEmbedding } from '@/libs/openai/embedding';
// import { pinecone } from '@/libs/pinecone/pinecone';

// async function uploadDocs() {
//   try {
//     // First check if index exists
//     const indexName = 'fintech-knowledge';
//     let index;
    
//     try {
//       // Try to get the index first
//       index = pinecone.index(indexName);
//       console.log('Found existing index:', indexName);
//     } catch (error) {
//       // If index doesn't exist, create it
//       console.log('Creating new index:', indexName);
//       await pinecone.createIndex({
//         name: indexName,
//         dimension: 1536,
//         metric: 'cosine',
//         spec: {
//           serverless: {
//             cloud: 'aws',
//             region: 'us-east-1'  // or your preferred region
//           }
//         }
//       });

//       // Wait for index to be ready
//       console.log('Waiting for index to initialize...');
//       await new Promise(resolve => setTimeout(resolve, 60000));
      
//       index = pinecone.index(indexName);
//     }

//     const docsDir = path.join(process.cwd(), 'src', 'docs');
//     console.log(`Looking for documents in: ${docsDir}`);
    
//     const documents = await processDocuments(docsDir);
//     console.log(`Processing ${documents.length} documents...`);

//     const beforeStats = await index.describeIndexStats();
//     console.log('Initial index stats:', beforeStats);

//     for (const doc of documents) {
//       const embedding = await getEmbedding(doc.content);
      
//       await index.upsert([{
//         id: `${doc.category}-${Date.now()}`,
//         values: embedding,
//         metadata: {
//           text: doc.content,
//           category: doc.category,
//           title: doc.title,
//           ...doc.metadata
//         }
//       }]);
      
//       console.log(`Uploaded: ${doc.title} (${doc.category})`);
//     }

//     const afterStats = await index.describeIndexStats();
//     console.log('Final index stats:', afterStats);
    
//     console.log(`
//     Upload Summary:
//     - Initial record count: ${beforeStats.totalRecordCount ?? 0}
//     - Final record count: ${afterStats.totalRecordCount ?? 0}
//     - New records added: ${(afterStats.totalRecordCount ?? 0) - (beforeStats.totalRecordCount ?? 0)}
//     `);

//   } catch (error) {
//     console.error('Error uploading documents:', error);
//     if (error instanceof Error) {
//       console.error('Error details:', error.message);
//     }
//     process.exit(1);
//   }
// }

// uploadDocs();
// import { processDocuments } from '@/libs/pinecone/processor';
// import { getEmbedding } from '@/libs/openai/embedding';
// import { pinecone } from '@/libs/pinecone';

// async function processDocs() {
//   // Process all markdown files
//   const documents = await processDocuments('./docs');
//   const index = pinecone.index('fintech-knowledge');

//   for (const doc of documents) {
//     const embedding = await getEmbedding(doc.content);

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
//   }
// }

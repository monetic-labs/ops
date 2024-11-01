import { pinecone } from '@/libs/pinecone';
import { getEmbedding } from '@/libs/openai/embedding';
import { knowledgeBase } from '@/libs/openai/retrieve';

async function populatePinecone() {
  const index = pinecone.index('fintech-knowledge');
  
  for (const [category, texts] of Object.entries(knowledgeBase)) {
    console.log(`Processing category: ${category}`);
    
    for (const text of texts) {
      const embedding = await getEmbedding(text);
      
      await index.upsert([{
        id: `${category}-${Date.now()}`,
        values: embedding,
        metadata: {
          text,
          category
        }
      }]);
    }
  }
}

populatePinecone().catch(console.error);
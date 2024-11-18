import { test, expect } from '@playwright/test';
import { pinecone } from '@/libs/pinecone/pinecone';
import { getEmbedding } from '@/libs/openai/embedding';

test.describe('Prompt Retrieval', () => {
    test('should retrieve relevant preferences for speed-focused query', async () => {
        const query = "I want to send money as fast as possible";
        const queryEmbedding = await getEmbedding(query);
        
        const index = pinecone.index('fintech-knowledge');
        const results = await index.query({
            vector: queryEmbedding,
            topK: 3,
            includeMetadata: true
        });

        await expect(results.matches.some(match => 
            match.metadata?.preference_type === 'speed_vs_cost'
        )).toBeTruthy();
    });
});
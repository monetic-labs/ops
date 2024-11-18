import { test, expect } from '@playwright/test';
import { processUsagePatterns, processExperiencePreferences } from '@/libs/pinecone/processor';
import { Graph } from '@/prompts/v0/helpers/graph';
import path from 'path';


test.describe('Prompt Processing Pipeline', () => {
    let mockGraph: Graph;
    
    test.beforeEach(async () => {
        // Setup test environment
        mockGraph = {
            nodes: {
                "transfers": {
                    type: "capability",
                    description: "Money transfer functionality",
                    requires: ["user-auth"],
                    ui_component: "transfers-tab"
                }
            },
            edges: []
        };
    });

    test('should process speed-over-cost preference', async () => {
        const expDir = path.join(process.cwd(), 'src/prompts/v0/experience');
        const results = await processExperiencePreferences(expDir, mockGraph);
        
        await expect(results.some(doc => 
            doc.type === 'preference' && 
            doc.metadata.preference_type === 'speed_vs_cost'
        )).toBeTruthy();
    });

    test('should validate capabilities against graph', async () => {
        const usageDir = path.join(process.cwd(), 'src/prompts/v0/usage');
        const results = await processUsagePatterns(usageDir, mockGraph);
        
        for (const doc of results) {
            const capabilities = doc.metadata.capabilities as string[];
            await expect(capabilities.every(cap => 
                mockGraph.nodes[cap]?.type === 'capability'
            )).toBeTruthy();
        }
    });
});
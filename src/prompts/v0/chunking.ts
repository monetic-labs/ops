interface ContextChunk {
    type: 'domain' | 'capability' | 'usage' | 'experience';
    priority: number;
    content: string;
    related_chunks: string[];
}
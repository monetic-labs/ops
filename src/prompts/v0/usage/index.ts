export interface UsagePattern {
    intent: string;
    context: string[];
    capabilities: string[];
    example_dialogue: {
        user: string;
        system: string;
    }[];
    edge_cases?: string[];
}
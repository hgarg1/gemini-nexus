export declare const getGeminiModel: (modelName?: string, apiKey?: string) => import("@google/generative-ai").GenerativeModel;
export declare const listGeminiModels: (apiKey?: string) => Promise<any>;
export declare const extractCheckpointSuggestion: (prompt: string, responseText: string, modelName: string, apiKey?: string) => Promise<{
    label: any;
    comment: any;
} | null>;
export declare const generateGeminiResponse: (prompt: string, history?: {
    role: string;
    parts: any[];
}[], apiKey?: string, config?: any, image?: string | string[]) => Promise<string>;
export declare const generateEmbedding: (text: string, apiKey?: string) => Promise<number[]>;
export declare const cosineSimilarity: (vecA: number[], vecB: number[]) => number;
//# sourceMappingURL=gemini.d.ts.map
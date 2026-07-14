export interface NIMModelConfig {
  id: string;
  name: string;
  endpoint: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  description: string;
  dimensions?: number;
  maxBatchSize?: number;
  maxDocuments?: number;
}

export const NIM_MODELS = {
  embedding: {
    id: "nvidia/llama-nemotron-embed-1b-v2",
    name: "Nemotron-Embed-1B-v2",
    endpoint: "/v1/embeddings",
    dimensions: 768,
    maxBatchSize: 128,
    description: "Code embedding for semantic search (verified by workflow, 565ms)",
  } as const,

  reranker: {
    id: "",
    name: "No Reranker",
    endpoint: "/v1/ranking",
    maxDocuments: 100,
    description: "Skipped - no NIM reranker available, using embedding similarity directly",
  } as const,

  examiner: {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1",
    name: "Nemotron-Super-49B",
    endpoint: "/v1/chat/completions",
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description: "Question generation and code analysis (verified by workflow, 1806ms)",
  } as const,

  scorer: {
    id: "nvidia/nemotron-3-super-120b-a12b",
    name: "Nemotron-3-Super-120B",
    endpoint: "/v1/chat/completions",
    maxTokens: 2048,
    temperature: 0.3,
    topP: 0.95,
    description: "Answer scoring and evaluation (verified by workflow, 577ms)",
  } as const,

  safety: {
    id: "nvidia/llama-3.1-nemoguard-8b-content-safety",
    name: "Nemoguard-8B-Safety",
    endpoint: "/v1/chat/completions",
    maxTokens: 256,
    temperature: 0.1,
    description: "Content safety classification (verified by workflow, 328ms)",
  } as const,
} as const;

export type NIMModelName = keyof typeof NIM_MODELS;

export function getModelConfig(model: NIMModelName): NIMModelConfig {
  return NIM_MODELS[model];
}

export function isModelAvailable(model: NIMModelName): boolean {
  const config = NIM_MODELS[model];
  return Boolean(config && config.id);
}

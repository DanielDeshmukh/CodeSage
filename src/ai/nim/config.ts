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
    id: "nvidia/nv-embedqa-e5-v5",
    name: "NV-Embed-QA",
    endpoint: "/v1/embeddings",
    dimensions: 768,
    maxBatchSize: 128,
    description: "High-quality text embeddings for semantic search",
  } as const,

  reranker: {
    id: "nvidia/nv-rerankqa-mistral-4b-v3",
    name: "NV-Rerank-QA",
    endpoint: "/v1/ranking",
    maxDocuments: 100,
    description: "Document reranking for improved retrieval relevance",
  } as const,

  examiner: {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1",
    name: "Nemotron-Super-49B",
    endpoint: "/v1/chat/completions",
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description: "Question generation and conversational AI",
  } as const,

  scorer: {
    id: "nvidia/nemotron-4-340b-reward",
    name: "Nemotron-340B-Reward",
    endpoint: "/v1/chat/completions",
    maxTokens: 2048,
    temperature: 0.3,
    topP: 0.95,
    description: "Objective answer scoring and evaluation",
  } as const,

  safety: {
    id: "nvidia/nemotron-3.5-content-safety",
    name: "Nemotron-Content-Safety",
    endpoint: "/v1/chat/completions",
    maxTokens: 256,
    temperature: 0.1,
    description: "Content safety classification and moderation",
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

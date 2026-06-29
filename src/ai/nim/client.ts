import { env } from "@/lib/env";

export interface NIMEmbeddingRequest {
  input: string[];
  model?: string;
}

export interface NIMEmbeddingResponse {
  data: number[][];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface NIMRerankRequest {
  query: string;
  documents: string[];
  model?: string;
  top_n?: number;
}

export interface NIMRerankResponse {
  results: Array<{
    index: number;
    relevance_score: number;
    document?: string;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface NIMChatRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface NIMChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface NIMSafetyRequest {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface NIMSafetyResponse {
  is_safe: boolean;
  safety_rating: string;
  flagged_categories: string[];
}

export interface NIMModelConfig {
  modelId: string;
  endpoint: string;
  maxTokens: number;
  temperature: number;
}

export class NIMClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = env.NIM_API_KEY;
    this.baseUrl = env.NIM_BASE_URL;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async embed(request: NIMEmbeddingRequest): Promise<NIMEmbeddingResponse> {
    const model = request.model || "nvidia/nv-embedqa-e5-v5";
    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        input: request.input,
        model,
        encoding_format: "float",
      }),
    });

    if (!response.ok) {
      throw new Error(`NIM Embedding failed: ${response.statusText}`);
    }

    return response.json();
  }

  async rerank(request: NIMRerankRequest): Promise<NIMRerankResponse> {
    const model = request.model || "nvidia/nv-rerankqa-mistral-4b-v3";
    const response = await fetch(`${this.baseUrl}/v1/ranking`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        query: { text: request.query },
        documents: request.documents.map((doc) => ({ text: doc })),
        top_n: request.top_n || request.documents.length,
      }),
    });

    if (!response.ok) {
      throw new Error(`NIM Rerank failed: ${response.statusText}`);
    }

    return response.json();
  }

  async chat(request: NIMChatRequest): Promise<NIMChatResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 2048,
        top_p: request.top_p || 0.9,
        stream: request.stream || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`NIM Chat failed: ${response.statusText}`);
    }

    return response.json();
  }

  async checkSafety(request: NIMSafetyRequest): Promise<NIMSafetyResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: "nvidia/llama-3.1-nemotron-70b-instruct",
        messages: [
          {
            role: "system",
            content: `You are a content safety classifier. Analyze the following message and determine if it contains harmful, unsafe, or inappropriate content. Respond with JSON: {"is_safe": boolean, "safety_rating": "safe"|"warning"|"unsafe", "flagged_categories": []}`,
          },
          ...request.messages,
        ],
        temperature: 0.1,
        max_tokens: 256,
      }),
    });

    if (!response.ok) {
      return {
        is_safe: true,
        safety_rating: "safe",
        flagged_categories: [],
      };
    }

    const data = await response.json();
    try {
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return {
        is_safe: parsed.is_safe ?? true,
        safety_rating: parsed.safety_rating ?? "safe",
        flagged_categories: parsed.flagged_categories ?? [],
      };
    } catch {
      return {
        is_safe: true,
        safety_rating: "safe",
        flagged_categories: [],
      };
    }
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const models = [
      { name: "embed", model: "nvidia/nv-embedqa-e5-v5" },
      { name: "rerank", model: "nvidia/nv-rerankqa-mistral-4b-v3" },
      { name: "examiner", model: "meta/llama-3.3-70b-instruct" },
      { name: "scorer", model: "nvidia/llama-3.1-nemotron-70b-instruct" },
      { name: "safety", model: "nvidia/llama-3.1-nemotron-70b-instruct" },
    ];

    const health: Record<string, boolean> = {};

    await Promise.allSettled(
      models.map(async (m) => {
        try {
          await this.embed({ input: ["health check"], model: m.model });
          health[m.name] = true;
        } catch {
          health[m.name] = false;
        }
      })
    );

    return health;
  }
}

let clientInstance: NIMClient | null = null;

export function getNIMClient(): NIMClient {
  if (!clientInstance) {
    clientInstance = new NIMClient();
  }
  return clientInstance;
}

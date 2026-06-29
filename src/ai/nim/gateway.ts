import { env } from "@/lib/env";
import type {
  EmbeddingRequest,
  EmbeddingResponse,
  RerankRequest,
  RerankResponse,
  ChatRequest,
  ChatResponse,
  ChatMessage,
} from "@/types";

// ============================================================================
// NIM Gateway Client
// ============================================================================

export class NIMGateway {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = env.NIM_BASE_URL;
    this.apiKey = env.NIM_API_KEY;
  }

  // --------------------------------------------------------------------------
  // Embedding Model
  // --------------------------------------------------------------------------

  async embed(input: string | string[]): Promise<EmbeddingResponse> {
    const inputs = Array.isArray(input) ? input : [input];

    const response = await fetch(
      `${this.baseUrl}/embeddings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: inputs,
          model: env.NIM_EMBED_MODEL,
          encoding_format: "float",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      embeddings: data.data.map((item: { embedding: number[] }) => item.embedding),
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Reranker Model
  // --------------------------------------------------------------------------

  async rerank(
    query: string,
    documents: string[],
    topN: number = 3
  ): Promise<RerankResponse> {
    const response = await fetch(
      `${this.baseUrl}/ranking`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: env.NIM_RERANK_MODEL,
          query: query,
          documents: documents,
          top_n: topN,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Reranking failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      results: data.data.map((item: { index: number; relevance_score: number }) => ({
        index: item.index,
        relevanceScore: item.relevance_score,
        document: documents[item.index],
      })),
      model: data.model,
    };
  }

  // --------------------------------------------------------------------------
  // Examiner Model (Chat)
  // --------------------------------------------------------------------------

  async examine(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<ChatResponse> {
    const response = await fetch(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: env.NIM_EXAMINER_MODEL,
          messages: messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Examiner failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Scorer Model (Reward)
  // --------------------------------------------------------------------------

  async score(
    prompt: string,
    completion: string
  ): Promise<{ score: number; model: string }> {
    const response = await fetch(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: env.NIM_SCORER_MODEL,
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: completion },
          ],
          temperature: 0,
          max_tokens: 1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Scorer failed: ${response.statusText}`);
    }

    const data = await response.json();
    // The reward model returns a score in the response
    // Note: Actual implementation may vary based on NIM API
    return {
      score: 0.5, // Placeholder - actual implementation depends on NIM API
      model: data.model,
    };
  }

  // --------------------------------------------------------------------------
  // Safety Model (Content Filtering)
  // --------------------------------------------------------------------------

  async checkSafety(
    content: string
  ): Promise<{ safe: boolean; categories?: string[]; model: string }> {
    const response = await fetch(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: env.NIM_SAFETY_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are a content safety classifier. Analyze the following content and determine if it is safe. Respond with JSON: {\"safe\": boolean, \"categories\": [\"unsafe category strings\"]}",
            },
            { role: "user", content },
          ],
          temperature: 0,
          max_tokens: 256,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Safety check failed: ${response.statusText}`);
    }

    const data = await response.json();
    try {
      const result = JSON.parse(data.choices[0].message.content);
      return {
        safe: result.safe,
        categories: result.categories,
        model: data.model,
      };
    } catch {
      return {
        safe: true,
        model: data.model,
      };
    }
  }
}

// Singleton instance
let nimInstance: NIMGateway | null = null;

export function getNIMGateway(): NIMGateway {
  if (!nimInstance) {
    nimInstance = new NIMGateway();
  }
  return nimInstance;
}

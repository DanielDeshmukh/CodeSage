import { getNIMClient, type NIMRerankResponse } from "./client";
import { NIM_MODELS } from "./config";

export interface RerankResult {
  index: number;
  relevanceScore: number;
  document: string;
}

export interface RerankOptions {
  topN?: number;
}

export class RerankerService {
  private client = getNIMClient();
  private config = NIM_MODELS.reranker;

  async rerank(
    query: string,
    documents: string[],
    options?: RerankOptions
  ): Promise<RerankResult[]> {
    if (documents.length === 0) {
      return [];
    }

    const topN = options?.topN || documents.length;
    const response = await this.client.rerank({
      query,
      documents,
      model: this.config.id,
      top_n: Math.min(topN, this.config.maxDocuments),
    });

    return response.results.map((result) => ({
      index: result.index,
      relevanceScore: result.relevance_score,
      document: documents[result.index],
    }));
  }

  async rerankWithIds<T extends { id: string; content: string }>(
    query: string,
    items: T[],
    options?: RerankOptions
  ): Promise<Array<T & { relevanceScore: number }>> {
    const documents = items.map((item) => item.content);
    const results = await this.rerank(query, documents, options);

    return results.map((result) => ({
      ...items[result.index],
      relevanceScore: result.relevanceScore,
    }));
  }

  async findTopMatches(
    query: string,
    documents: string[],
    topK: number = 5
  ): Promise<string[]> {
    const results = await this.rerank(query, documents, { topN: topK });
    return results.map((r) => r.document);
  }

  getMaxDocuments(): number {
    return this.config.maxDocuments;
  }
}

let instance: RerankerService | null = null;

export function getRerankerService(): RerankerService {
  if (!instance) {
    instance = new RerankerService();
  }
  return instance;
}

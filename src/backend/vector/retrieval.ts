import { getEmbeddingService } from "@/ai/nim/embedding";
import { getRerankerService } from "@/ai/nim/reranker";
import { getQdrantClient, type SearchFilter } from "./qdrant";

export interface RetrievalOptions {
  repositoryId: string;
  query: string;
  topK?: number;
  rerankTopN?: number;
  filter?: SearchFilter;
  minScore?: number;
}

export interface RetrievedChunk {
  id: string;
  name: string;
  type: string;
  content: string;
  summary: string | null;
  language: string;
  score: number;
  relevanceScore: number;
  filePath: string;
  startLine: number;
  endLine: number;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  query: string;
  totalCandidates: number;
  finalResults: number;
  durationMs: number;
}

export class RetrievalPipeline {
  private embeddingService = getEmbeddingService();
  private rerankerService = getRerankerService();
  private qdrantClient = getQdrantClient();

  async retrieve(options: RetrievalOptions): Promise<RetrievalResult> {
    const startTime = Date.now();
    const {
      repositoryId,
      query,
      topK = 5,
      rerankTopN = 3,
      filter,
      minScore = 0.3,
    } = options;

    // Stage 1: Vector search (top-10 candidates)
    const queryEmbedding = await this.embeddingService.embedSingle(query);

    const candidates = await this.qdrantClient.search(queryEmbedding, {
      filter: {
        repositoryId,
        ...filter,
      },
      limit: topK * 2,
      scoreThreshold: minScore,
    });

    // Stage 2: Rerank (top-3 final results)
    if (candidates.length === 0) {
      return {
        chunks: [],
        query,
        totalCandidates: 0,
        finalResults: 0,
        durationMs: Date.now() - startTime,
      };
    }

    const documents = candidates.map(
      (c) => `${c.payload.name}: ${c.payload.content.slice(0, 1000)}`
    );

    const reranked = await this.rerankerService.rerank(query, documents, {
      topN: Math.min(rerankTopN, candidates.length),
    });

    // Map reranked results back to full chunk data
    const chunks: RetrievedChunk[] = reranked.map((result) => {
      const candidate = candidates[result.index];
      return {
        id: candidate.id,
        name: candidate.payload.name,
        type: candidate.payload.type,
        content: candidate.payload.content,
        summary: candidate.payload.summary,
        language: candidate.payload.language,
        score: candidate.score,
        relevanceScore: result.relevanceScore,
        filePath: candidate.payload.filePath,
        startLine: candidate.payload.startLine,
        endLine: candidate.payload.endLine,
      };
    });

    return {
      chunks,
      query,
      totalCandidates: candidates.length,
      finalResults: chunks.length,
      durationMs: Date.now() - startTime,
    };
  }

  async retrieveBatch(
    queries: string[],
    repositoryId: string,
    topK: number = 5
  ): Promise<Map<string, RetrievedChunk[]>> {
    const results = new Map<string, RetrievedChunk[]>();

    await Promise.all(
      queries.map(async (query) => {
        const result = await this.retrieve({
          repositoryId,
          query,
          topK,
          rerankTopN: 3,
        });
        results.set(query, result.chunks);
      })
    );

    return results;
  }

  async retrieveByType(
    query: string,
    repositoryId: string,
    type: string,
    topK: number = 5
  ): Promise<RetrievedChunk[]> {
    const result = await this.retrieve({
      repositoryId,
      query,
      topK,
      filter: { type },
    });
    return result.chunks;
  }

  async retrieveByLanguage(
    query: string,
    repositoryId: string,
    language: string,
    topK: number = 5
  ): Promise<RetrievedChunk[]> {
    const result = await this.retrieve({
      repositoryId,
      query,
      topK,
      filter: { language },
    });
    return result.chunks;
  }
}

let instance: RetrievalPipeline | null = null;

export function getRetrievalPipeline(): RetrievalPipeline {
  if (!instance) {
    instance = new RetrievalPipeline();
  }
  return instance;
}

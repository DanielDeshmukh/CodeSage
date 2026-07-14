import { getEmbeddingService } from "@/ai/nim/embedding";
import { getQdrantClient, type QdrantPoint } from "./qdrant";
import type { NormalizedChunk } from "@/backend/ast/normalizer";

export interface EmbeddingProgress {
  stage: "embedding" | "storing" | "complete";
  message: string;
  progress: number;
  processed?: number;
  total?: number;
}

export interface EmbeddingResult {
  success: boolean;
  chunksEmbedded: number;
  vectorsStored: number;
  errors: string[];
  durationMs: number;
}

export class EmbeddingPipeline {
  private embeddingService = getEmbeddingService();
  private qdrantClient = getQdrantClient();
  private batchSize = 10;

  private onProgress?: (progress: EmbeddingProgress) => void;

  setProgressCallback(callback: (progress: EmbeddingProgress) => void): void {
    this.onProgress = callback;
  }

  private reportProgress(progress: EmbeddingProgress): void {
    this.onProgress?.(progress);
  }

  async embedAndStore(
    chunks: NormalizedChunk[],
    repositoryId: string
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let chunksEmbedded = 0;
    let vectorsStored = 0;

    try {
      // Ensure collection exists
      await this.qdrantClient.ensureCollection();

      // Process in batches
      for (let i = 0; i < chunks.length; i += this.batchSize) {
        const batch = chunks.slice(i, i + Math.min(this.batchSize, chunks.length - i));

        this.reportProgress({
          stage: "embedding",
          message: `Embedding batch ${Math.floor(i / this.batchSize) + 1}...`,
          progress: Math.round((i / chunks.length) * 60),
          processed: i,
          total: chunks.length,
        });

        // Generate embeddings
        const texts = batch.map((chunk) =>
          this.formatChunkForEmbedding(chunk)
        );

        try {
          const embeddings = await this.embeddingService.embed(texts);

          // Create Qdrant points
          const points: QdrantPoint[] = batch.map((chunk, idx) => ({
            id: chunk.id,
            vector: embeddings[idx],
            payload: {
              repositoryId,
              chunkId: chunk.id,
              type: chunk.type,
              name: chunk.name,
              filePath: chunk.filePath,
              language: chunk.language,
              content: chunk.content.slice(0, 10000),
              summary: chunk.summary,
              startLine: chunk.startLine,
              endLine: chunk.endLine,
            },
          }));

          this.reportProgress({
            stage: "storing",
            message: `Storing batch ${Math.floor(i / this.batchSize) + 1}...`,
            progress: 60 + Math.round((i / chunks.length) * 30),
            processed: i,
            total: chunks.length,
          });

          // Store in Qdrant
          await this.qdrantClient.upsertPoints(points);
          vectorsStored += points.length;
          chunksEmbedded += batch.length;
        } catch (error) {
          const errorMsg = `Batch ${Math.floor(i / this.batchSize) + 1}: ${error instanceof Error ? error.message : "Unknown error"}`;
          errors.push(errorMsg);
          console.error("Embedding batch failed:", error);
        }
      }

      this.reportProgress({
        stage: "complete",
        message: "Embedding complete",
        progress: 100,
      });

      return {
        success: errors.length === 0,
        chunksEmbedded,
        vectorsStored,
        errors,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        chunksEmbedded,
        vectorsStored,
        errors: [...errors, error instanceof Error ? error.message : "Pipeline failed"],
        durationMs: Date.now() - startTime,
      };
    }
  }

  private formatChunkForEmbedding(chunk: NormalizedChunk): string {
    const parts = [
      `${chunk.type} ${chunk.name}`,
      `Language: ${chunk.language}`,
      chunk.summary ? `Summary: ${chunk.summary}` : "",
      `Complexity: ${chunk.complexity}`,
      `Lines: ${chunk.lineCount}`,
      chunk.content.slice(0, 1500),
    ];

    return parts.filter(Boolean).join("\n");
  }

  async deleteRepositoryVectors(repositoryId: string): Promise<void> {
    await this.qdrantClient.deleteByRepository(repositoryId);
  }

  async getRepositoryEmbeddingStats(repositoryId: string): Promise<{
    totalChunks: number;
    languages: Record<string, number>;
    types: Record<string, number>;
  }> {
    return this.qdrantClient.getRepositoryStats(repositoryId);
  }
}

let instance: EmbeddingPipeline | null = null;

export function getEmbeddingPipeline(): EmbeddingPipeline {
  if (!instance) {
    instance = new EmbeddingPipeline();
  }
  return instance;
}

import { getNIMClient } from "./client";
import { NIM_MODELS } from "./config";

export interface EmbeddingOptions {
  batchSize?: number;
  dimensions?: number;
}

export class EmbeddingService {
  private client = getNIMClient();
  private config = NIM_MODELS.embedding;

  async embed(texts: string[], options?: EmbeddingOptions): Promise<number[][]> {
    const batchSize = options?.batchSize || this.config.maxBatchSize;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.client.embed({
        input: batch,
        model: this.config.id,
      });

      allEmbeddings.push(...response.data);
    }

    return allEmbeddings;
  }

  async embedSingle(text: string): Promise<number[]> {
    const embeddings = await this.embed([text]);
    return embeddings[0];
  }

  async embedWithMetadata(
    items: Array<{ id: string; text: string; metadata?: Record<string, unknown> }>
  ): Promise<
    Array<{
      id: string;
      embedding: number[];
      text: string;
      metadata?: Record<string, unknown>;
    }>
  > {
    const texts = items.map((item) => item.text);
    const embeddings = await this.embed(texts);

    return items.map((item, index) => ({
      id: item.id,
      embedding: embeddings[index],
      text: item.text,
      metadata: item.metadata,
    }));
  }

  getDimensions(): number {
    return this.config.dimensions;
  }
}

let instance: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!instance) {
    instance = new EmbeddingService();
  }
  return instance;
}

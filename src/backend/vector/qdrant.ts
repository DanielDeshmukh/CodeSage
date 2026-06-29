import { env } from "@/lib/env";

// ============================================================================
// Qdrant Vector Database Client
// ============================================================================

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    repositoryId: string;
    chunkId: string;
    type: string;
    name: string;
    filePath: string;
    language: string;
    content: string;
    summary: string | null;
    startLine: number;
    endLine: number;
  };
}

export interface SearchFilter {
  repositoryId?: string;
  type?: string;
  language?: string;
}

export class QdrantClient {
  private baseUrl: string;
  private apiKey?: string;
  private collectionName = "code_chunks";

  constructor() {
    this.baseUrl = env.QDRANT_URL;
    this.apiKey = env.QDRANT_API_KEY;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["api-key"] = this.apiKey;
    }
    return headers;
  }

  // --------------------------------------------------------------------------
  // Collection Management
  // --------------------------------------------------------------------------

  async ensureCollection(): Promise<void> {
    try {
      // Check if collection exists
      const response = await fetch(
        `${this.baseUrl}/collections/${this.collectionName}`,
        { headers: this.getHeaders() }
      );

      if (response.ok) {
        return; // Collection exists
      }

      // Create collection
      await fetch(`${this.baseUrl}/collections/${this.collectionName}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({
          vectors: {
            size: 1024, // Nemotron Embed 1B produces 1024-dimensional vectors
            distance: "Cosine",
          },
        }),
      });
    } catch (error) {
      console.error("Failed to ensure collection:", error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Point Operations
  // --------------------------------------------------------------------------

  async upsertPoints(points: QdrantPoint[]): Promise<void> {
    await fetch(`${this.baseUrl}/collections/${this.collectionName}/points`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ points }),
    });
  }

  async deletePoints(ids: string[]): Promise<void> {
    await fetch(`${this.baseUrl}/collections/${this.collectionName}/points/delete`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ points: ids }),
    });
  }

  // --------------------------------------------------------------------------
  // Search Operations
  // --------------------------------------------------------------------------

  async search(
    vector: number[],
    options: {
      filter?: SearchFilter;
      limit?: number;
      scoreThreshold?: number;
    } = {}
  ): Promise<
    {
      id: string;
      score: number;
      payload: QdrantPoint["payload"];
    }[]
  > {
    const filter: Record<string, unknown> = {};

    if (options.filter?.repositoryId || options.filter?.type || options.filter?.language) {
      const must: Record<string, unknown>[] = [];

      if (options.filter.repositoryId) {
        must.push({
          key: "repositoryId",
          match: { value: options.filter.repositoryId },
        });
      }
      if (options.filter.type) {
        must.push({
          key: "type",
          match: { value: options.filter.type },
        });
      }
      if (options.filter.language) {
        must.push({
          key: "language",
          match: { value: options.filter.language },
        });
      }

      filter.must = must;
    }

    const response = await fetch(
      `${this.baseUrl}/collections/${this.collectionName}/points/search`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          vector,
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          limit: options.limit || 10,
          score_threshold: options.scoreThreshold,
          with_payload: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result.map(
      (item: {
        id: string;
        score: number;
        payload: QdrantPoint["payload"];
      }) => ({
        id: item.id,
        score: item.score,
        payload: item.payload,
      })
    );
  }

  // --------------------------------------------------------------------------
  // Scroll Operations (get all points for a repository)
  // --------------------------------------------------------------------------

  async scrollByRepository(
    repositoryId: string,
    limit: number = 1000
  ): Promise<QdrantPoint[]> {
    const response = await fetch(
      `${this.baseUrl}/collections/${this.collectionName}/points/scroll`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          filter: {
            must: [
              {
                key: "repositoryId",
                match: { value: repositoryId },
              },
            ],
          },
          limit,
          with_payload: true,
          with_vector: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Scroll failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result.points.map(
      (item: { id: string; payload: QdrantPoint["payload"] }) => ({
        id: item.id,
        vector: [],
        payload: item.payload,
      })
    );
  }

  // --------------------------------------------------------------------------
  // Delete by Repository
  // --------------------------------------------------------------------------

  async deleteByRepository(repositoryId: string): Promise<void> {
    await fetch(`${this.baseUrl}/collections/${this.collectionName}/points/delete`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        filter: {
          must: [
            {
              key: "repositoryId",
              match: { value: repositoryId },
            },
          ],
        },
      }),
    });
  }
}

// Singleton instance
let qdrantInstance: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!qdrantInstance) {
    qdrantInstance = new QdrantClient();
  }
  return qdrantInstance;
}

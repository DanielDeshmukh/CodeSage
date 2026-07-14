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
  private _available: boolean | null = null;

  constructor() {
    this.baseUrl = env.QDRANT_URL;
    this.apiKey = env.QDRANT_API_KEY;
  }

  async isAvailable(): Promise<boolean> {
    if (this._available !== null) return this._available;
    try {
      const res = await fetch(`${this.baseUrl}/collections`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(3000),
      });
      this._available = res.ok;
    } catch {
      this._available = false;
    }
    return this._available;
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
    if (!(await this.isAvailable())) return;
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
            size: 2048, // Nemotron Embed 1B v2 produces 2048-dimensional vectors
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
    if (!(await this.isAvailable())) return;
    // Qdrant requires UUID or unsigned integer IDs — use numeric hash
    const numericPoints = points.map((p) => ({
      id: this.numericId(p.id),
      vector: Array.isArray(p.vector) ? p.vector.map(Number) : p.vector,
      payload: p.payload,
    }));

    const response = await fetch(`${this.baseUrl}/collections/${this.collectionName}/points`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ points: numericPoints }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Qdrant upsert failed: ${response.status} ${text}`);
    }
  }

  private numericId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) || 1;
  }

  async deletePoints(ids: string[]): Promise<void> {
    if (!(await this.isAvailable())) return;
    const numericIds = ids.map((id) => this.numericId(id));
    await fetch(`${this.baseUrl}/collections/${this.collectionName}/points/delete`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ points: numericIds }),
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
    if (!(await this.isAvailable())) return [];
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
    if (!(await this.isAvailable())) return [];
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
    if (!(await this.isAvailable())) return;
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

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  async getCollectionInfo(): Promise<{
    pointsCount: number;
    vectorsSize: number;
    status: string;
  }> {
    if (!(await this.isAvailable())) {
      return { pointsCount: 0, vectorsSize: 0, status: "unavailable" };
    }
    const response = await fetch(
      `${this.baseUrl}/collections/${this.collectionName}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to get collection info: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      pointsCount: data.result.points_count || 0,
      vectorsSize: data.result.config?.params?.vectors?.size || 768,
      status: data.result.status || "unknown",
    };
  }

  async getRepositoryStats(repositoryId: string): Promise<{
    totalChunks: number;
    languages: Record<string, number>;
    types: Record<string, number>;
  }> {
    if (!(await this.isAvailable())) {
      return { totalChunks: 0, languages: {}, types: {} };
    }
    const points = await this.scrollByRepository(repositoryId, 10000);

    const languages: Record<string, number> = {};
    const types: Record<string, number> = {};

    for (const point of points) {
      const lang = point.payload.language;
      const type = point.payload.type;
      languages[lang] = (languages[lang] || 0) + 1;
      types[type] = (types[type] || 0) + 1;
    }

    return {
      totalChunks: points.length,
      languages,
      types,
    };
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

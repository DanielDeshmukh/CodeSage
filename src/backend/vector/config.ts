export interface QdrantConfig {
  url: string;
  apiKey?: string;
  collectionName: string;
  vectorSize: number;
}

export function getQdrantConfig(): QdrantConfig {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    url:
      process.env.QDRANT_URL ||
      (isProduction
        ? "https://localhost:6333"
        : "http://localhost:6333"),
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: process.env.QDRANT_COLLECTION || "codesage",
    vectorSize: 768,
  };
}

export function getQdrantHeaders(): Record<string, string> {
  const config = getQdrantConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.apiKey) {
    headers["api-key"] = config.apiKey;
  }

  return headers;
}

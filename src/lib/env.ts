import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // NIM API Configuration
    NIM_API_KEY: z.string().default(""),
    NIM_BASE_URL: z.string().url("NIM base URL must be a valid URL").default("https://integrate.api.nvidia.com/v1"),

    // Model Endpoints (verified by GitHub Actions workflow)
    NIM_EMBED_MODEL: z.string().default("nvidia/llama-nemotron-embed-1b-v2"),
    NIM_RERANK_MODEL: z.string().default(""), // Not available in NIM
    NIM_EXAMINER_MODEL: z.string().default("nvidia/llama-3.3-nemotron-super-49b-v1"),
    NIM_SCORER_MODEL: z.string().default("nvidia/nemotron-3-super-120b-a12b"),
    NIM_SAFETY_MODEL: z.string().default("nvidia/llama-3.1-nemoguard-8b-content-safety"),

    // Qdrant Configuration
    QDRANT_URL: z.string().url("Qdrant URL must be a valid URL").default("http://localhost:6333"),
    QDRANT_API_KEY: z.string().optional(),
    QDRANT_COLLECTION: z.string().default("codesage"),

    // GitHub Configuration
    GITHUB_TOKEN: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // Database
    DATABASE_URL: z.string().optional(),

    // App Configuration
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },

  runtimeEnv: {
    NIM_API_KEY: process.env.NIM_API_KEY,
    NIM_BASE_URL: process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1",
    NIM_EMBED_MODEL: process.env.NIM_EMBED_MODEL,
    NIM_RERANK_MODEL: process.env.NIM_RERANK_MODEL,
    NIM_EXAMINER_MODEL: process.env.NIM_EXAMINER_MODEL,
    NIM_SCORER_MODEL: process.env.NIM_SCORER_MODEL,
    NIM_SAFETY_MODEL: process.env.NIM_SAFETY_MODEL,
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    QDRANT_COLLECTION: process.env.QDRANT_COLLECTION,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});

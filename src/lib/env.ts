import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // NIM API Configuration
    NIM_API_KEY: z.string().min(1, "NIM API key is required"),
    NIM_BASE_URL: z.string().url("NIM base URL must be a valid URL"),

    // Model Endpoints
    NIM_EMBED_MODEL: z.string().default("nvidia/llama-nemotron-embed-1b-v2"),
    NIM_RERANK_MODEL: z.string().default("nvidia/llama-nemotron-rerank-1b-v2"),
    NIM_EXAMINER_MODEL: z.string().default("nvidia/llama-nemotron-super-49b-v1"),
    NIM_SCORER_MODEL: z.string().default("nvidia/nemotron-4-340b-reward"),
    NIM_SAFETY_MODEL: z.string().default("nvidia/nemotron-3.5-content-safety"),

    // Qdrant Configuration
    QDRANT_URL: z.string().url("Qdrant URL must be a valid URL").default("http://localhost:6333"),
    QDRANT_API_KEY: z.string().optional(),

    // GitHub Configuration
    GITHUB_TOKEN: z.string().optional(),

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
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});

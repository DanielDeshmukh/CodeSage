import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    NIM_API_KEY: "test-api-key",
    NIM_BASE_URL: "https://test.api.nvidia.com/v1",
    NIM_EMBED_MODEL: "nvidia/llama-nemotron-embed-1b-v2",
    NIM_RERANK_MODEL: "nvidia/llama-nemotron-rerank-1b-v2",
    NIM_EXAMINER_MODEL: "nvidia/llama-nemotron-super-49b-v1",
    NIM_SCORER_MODEL: "nvidia/nemotron-4-340b-reward",
    NIM_SAFETY_MODEL: "nvidia/nemotron-3.5-content-safety",
    QDRANT_URL: "http://localhost:6333",
    QDRANT_API_KEY: undefined,
    GITHUB_TOKEN: undefined,
    DATABASE_URL: undefined,
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
process.env.NIM_API_KEY = "test-api-key";
process.env.NIM_BASE_URL = "https://test.api.nvidia.com/v1";
process.env.QDRANT_URL = "http://localhost:6333";

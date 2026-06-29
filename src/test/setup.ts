import "@testing-library/jest-dom";

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
process.env.NIM_API_KEY = "test-api-key";
process.env.NIM_BASE_URL = "https://test.api.nvidia.com/v1";
process.env.QDRANT_URL = "http://localhost:6333";

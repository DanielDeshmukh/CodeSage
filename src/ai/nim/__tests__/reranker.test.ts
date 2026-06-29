import { describe, it, expect, vi, beforeEach } from "vitest";
import { RerankerService } from "../reranker";

describe("RerankerService", () => {
  let service: RerankerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RerankerService();
  });

  describe("rerank", () => {
    it("should rerank documents by relevance", async () => {
      const mockResponse = {
        results: [
          { index: 1, relevance_score: 0.9 },
          { index: 0, relevance_score: 0.7 },
        ],
        model: "test-model",
        usage: { prompt_tokens: 20, total_tokens: 20 },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.rerank("query", ["doc1", "doc2"]);

      expect(result).toHaveLength(2);
      expect(result[0].relevanceScore).toBe(0.9);
      expect(result[0].document).toBe("doc2");
    });

    it("should return empty array for empty documents", async () => {
      const result = await service.rerank("query", []);

      expect(result).toHaveLength(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should respect topN limit", async () => {
      const mockResponse = {
        results: [{ index: 0, relevance_score: 0.9 }],
        model: "test-model",
        usage: { prompt_tokens: 10, total_tokens: 10 },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.rerank("query", ["doc1", "doc2", "doc3"], {
        topN: 1,
      });

      expect(result).toHaveLength(1);
    });
  });

  describe("findTopMatches", () => {
    it("should return top K documents", async () => {
      const mockResponse = {
        results: [
          { index: 2, relevance_score: 0.95 },
          { index: 0, relevance_score: 0.8 },
        ],
        model: "test-model",
        usage: { prompt_tokens: 20, total_tokens: 20 },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.findTopMatches(
        "query",
        ["doc1", "doc2", "doc3"],
        2
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toBe("doc3");
    });
  });
});

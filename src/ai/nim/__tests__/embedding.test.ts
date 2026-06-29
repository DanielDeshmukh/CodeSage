import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmbeddingService } from "../embedding";

describe("EmbeddingService", () => {
  let service: EmbeddingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmbeddingService();
  });

  describe("embed", () => {
    it("should embed single text", async () => {
      const mockResponse = {
        data: [[0.1, 0.2, 0.3]],
        model: "test-model",
        usage: { prompt_tokens: 10, total_tokens: 10 },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.embed(["test text"]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual([0.1, 0.2, 0.3]);
    });

    it("should batch multiple texts", async () => {
      const mockResponse = {
        data: [
          [0.1, 0.2],
          [0.3, 0.4],
          [0.5, 0.6],
        ],
        model: "test-model",
        usage: { prompt_tokens: 30, total_tokens: 30 },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.embed(["text1", "text2", "text3"]);

      expect(result).toHaveLength(3);
    });
  });

  describe("embedSingle", () => {
    it("should return single embedding", async () => {
      const mockResponse = {
        data: [[0.1, 0.2, 0.3]],
        model: "test-model",
        usage: { prompt_tokens: 10, total_tokens: 10 },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.embedSingle("test text");

      expect(result).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe("getDimensions", () => {
    it("should return 768 dimensions", () => {
      expect(service.getDimensions()).toBe(768);
    });
  });
});

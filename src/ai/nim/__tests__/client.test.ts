import { describe, it, expect, vi, beforeEach } from "vitest";
import { NIMClient } from "../client";

describe("NIMClient", () => {
  let client: NIMClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new NIMClient();
  });

  describe("embed", () => {
    it("should call embedding endpoint with correct parameters", async () => {
      const mockResponse = {
        data: [[0.1, 0.2, 0.3]],
        model: "test-model",
        usage: { prompt_tokens: 10, total_tokens: 10 },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.embed({ input: ["test text"] });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/embeddings"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        })
      );
      expect(result.data).toEqual([[0.1, 0.2, 0.3]]);
    });

    it("should throw error on failed request", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
      });

      await expect(
        client.embed({ input: ["test text"] })
      ).rejects.toThrow("NIM Embedding failed");
    });
  });

  describe("chat", () => {
    it("should call chat completions endpoint", async () => {
      const mockResponse = {
        id: "test-id",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hello!" },
            finish_reason: "stop",
          },
        ],
        model: "test-model",
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.chat({
        model: "test-model",
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(result.choices[0].message.content).toBe("Hello!");
    });
  });

  describe("healthCheck", () => {
    it("should check all models and return health status", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [[]] }),
      });

      const health = await client.healthCheck();

      expect(health).toHaveProperty("embed");
      expect(health).toHaveProperty("rerank");
      expect(health).toHaveProperty("examiner");
      expect(health).toHaveProperty("scorer");
      expect(health).toHaveProperty("safety");
    });
  });
});

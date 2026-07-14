import { describe, it, expect, vi, beforeEach } from "vitest";
import { QdrantClient } from "../qdrant";

describe("QdrantClient", () => {
  let client: QdrantClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QdrantClient();
  });

  describe("ensureCollection", () => {
    it("should create collection if not exists", async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true }) // isAvailable check
        .mockResolvedValueOnce({ ok: false }) // GET collection
        .mockResolvedValueOnce({ ok: true }); // PUT create

      await client.ensureCollection();

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("should not create if exists", async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true }) // isAvailable check
        .mockResolvedValueOnce({ ok: true }); // GET collection

      await client.ensureCollection();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("upsertPoints", () => {
    it("should upsert points to collection", async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true }) // isAvailable check
        .mockResolvedValueOnce({ ok: true }); // upsert

      await client.upsertPoints([
        {
          id: "1",
          vector: [0.1, 0.2, 0.3],
          payload: {
            repositoryId: "repo1",
            chunkId: "chunk1",
            type: "function",
            name: "test",
            filePath: "test.ts",
            language: "typescript",
            content: "test content",
            summary: null,
            startLine: 1,
            endLine: 10,
          },
        },
      ]);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/points"),
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  describe("search", () => {
    it("should search with vector and filters", async () => {
      const mockResult = {
        result: [
          {
            id: "1",
            score: 0.9,
            payload: {
              repositoryId: "repo1",
              chunkId: "chunk1",
              type: "function",
              name: "test",
              filePath: "test.ts",
              language: "typescript",
              content: "content",
              summary: null,
              startLine: 1,
              endLine: 10,
            },
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true }) // isAvailable check
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResult),
        }); // search

      const results = await client.search([0.1, 0.2, 0.3], {
        filter: { repositoryId: "repo1" },
        limit: 5,
      });

      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0.9);
    });
  });

  describe("getRepositoryStats", () => {
    it("should return repository statistics", async () => {
      const mockPoints = [
        {
          id: "1",
          vector: [],
          payload: {
            repositoryId: "repo1",
            chunkId: "c1",
            type: "function",
            name: "f1",
            filePath: "a.ts",
            language: "typescript",
            content: "",
            summary: null,
            startLine: 1,
            endLine: 1,
          },
        },
        {
          id: "2",
          vector: [],
          payload: {
            repositoryId: "repo1",
            chunkId: "c2",
            type: "class",
            name: "C1",
            filePath: "b.py",
            language: "python",
            content: "",
            summary: null,
            startLine: 1,
            endLine: 1,
          },
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true }) // isAvailable check
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: { points: mockPoints } }),
        }); // scroll

      const stats = await client.getRepositoryStats("repo1");

      expect(stats.totalChunks).toBe(2);
      expect(stats.languages.typescript).toBe(1);
      expect(stats.languages.python).toBe(1);
      expect(stats.types.function).toBe(1);
      expect(stats.types.class).toBe(1);
    });
  });
});

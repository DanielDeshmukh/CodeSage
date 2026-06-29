import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuestionGenerator } from "../question-generator";

vi.mock("@/ai/nim/client", () => ({
  getNIMClient: () => ({
    chat: vi.fn(),
  }),
}));

vi.mock("@/backend/vector/retrieval", () => ({
  getRetrievalPipeline: () => ({
    retrieve: vi.fn(),
  }),
}));

describe("QuestionGenerator", () => {
  let generator: QuestionGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new QuestionGenerator();
  });

  describe("generateQuestion", () => {
    it("should return null when no chunks found", async () => {
      const mockRetrieve = vi.fn().mockResolvedValue({ chunks: [] });
      (generator as any).retrievalPipeline.retrieve = mockRetrieve;

      const result = await generator.generateQuestion({
        repositoryId: "repo-1",
        mode: "viva",
        difficulty: "intermediate",
      });

      expect(result).toBeNull();
    });

    it("should generate question from retrieved chunk", async () => {
      const mockRetrieve = vi.fn().mockResolvedValue({
        chunks: [
          {
            id: "chunk-1",
            name: "processOrder",
            filePath: "src/order.ts",
            language: "typescript",
            content: "function processOrder() {}",
            summary: "Processes orders",
          },
        ],
      });
      (generator as any).retrievalPipeline.retrieve = mockRetrieve;

      const mockChat = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  id: "q1",
                  question: "What does processOrder do?",
                  type: "conceptual",
                  difficulty: "intermediate",
                  expectedPoints: ["Handles errors"],
                },
              ]),
            },
          },
        ],
      });
      (generator as any).client.chat = mockChat;

      const result = await generator.generateQuestion({
        repositoryId: "repo-1",
        mode: "viva",
        difficulty: "intermediate",
      });

      expect(result).not.toBeNull();
      expect(result?.question).toBe("What does processOrder do?");
      expect(result?.sourceChunk.filePath).toBe("src/order.ts");
    });
  });

  describe("getQueryForIndex", () => {
    it("should return different queries per mode", () => {
      const queries = (generator as any).getQueryForIndex(0, "viva");
      expect(typeof queries).toBe("string");
      expect(queries.length).toBeGreaterThan(0);
    });

    it("should cycle through queries", () => {
      const q1 = (generator as any).getQueryForIndex(0, "interview");
      const q2 = (generator as any).getQueryForIndex(8, "interview");
      expect(q1).toBe(q2);
    });
  });
});

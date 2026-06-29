import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnswerEvaluator } from "../answer-evaluator";

vi.mock("@/ai/nim/client", () => ({
  getNIMClient: () => ({
    chat: vi.fn(),
  }),
}));

describe("AnswerEvaluator", () => {
  let evaluator: AnswerEvaluator;

  beforeEach(() => {
    vi.clearAllMocks();
    evaluator = new AnswerEvaluator();
  });

  describe("evaluate", () => {
    it("should evaluate answer and return score", async () => {
      const mockChat = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 85,
                breakdown: { accuracy: 80, completeness: 90, clarity: 85, depth: 85 },
                feedback: "Good answer",
                matchedPoints: ["point1"],
                missedPoints: ["point2"],
              }),
            },
          },
        ],
      });
      (evaluator as any).client.chat = mockChat;

      const result = await evaluator.evaluate({
        question: {
          id: "q1",
          question: "What is X?",
          type: "conceptual",
          difficulty: "intermediate",
          context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
          expectedPoints: ["point1", "point2"],
        },
        answer: "X is...",
        context: {
          repositoryId: "repo-1",
          language: "typescript",
          filePath: "test.ts",
          chunkName: "test",
          codeContent: "test",
        },
      });

      expect(result.score).toBe(85);
      expect(result.breakdown.accuracy).toBe(80);
      expect(result.feedback).toBe("Good answer");
      expect(result.matchedPoints).toContain("point1");
      expect(result.missedPoints).toContain("point2");
    });

    it("should return fallback on invalid JSON", async () => {
      const mockChat = vi.fn().mockResolvedValue({
        choices: [{ message: { content: "Not valid JSON" } }],
      });
      (evaluator as any).client.chat = mockChat;

      const result = await evaluator.evaluate({
        question: {
          id: "q1",
          question: "What?",
          type: "conceptual",
          difficulty: "intermediate",
          context: { filePath: "t.ts", language: "typescript", chunkName: "t" },
          expectedPoints: ["p1"],
        },
        answer: "Answer",
        context: { repositoryId: "r", language: "typescript", filePath: "t.ts", chunkName: "t", codeContent: "" },
      });

      expect(result.score).toBe(0);
      expect(result.feedback).toBe("Failed to evaluate answer");
    });

    it("should clamp scores to 0-100", async () => {
      const mockChat = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 150,
                breakdown: { accuracy: 200, completeness: -10, clarity: 50, depth: 50 },
                feedback: "Test",
              }),
            },
          },
        ],
      });
      (evaluator as any).client.chat = mockChat;

      const result = await evaluator.evaluate({
        question: {
          id: "q1",
          question: "Q",
          type: "conceptual",
          difficulty: "intermediate",
          context: { filePath: "t.ts", language: "typescript", chunkName: "t" },
          expectedPoints: [],
        },
        answer: "A",
        context: { repositoryId: "r", language: "typescript", filePath: "t.ts", chunkName: "t", codeContent: "" },
      });

      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown.accuracy).toBeLessThanOrEqual(100);
      expect(result.breakdown.completeness).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateOverallScore", () => {
    it("should return 0 for empty evaluations", () => {
      const result = evaluator.calculateOverallScore([]);
      expect(result.overall).toBe(0);
    });

    it("should calculate average scores", () => {
      const result = evaluator.calculateOverallScore([
        {
          questionId: "q1",
          score: 80,
          maxScore: 100,
          breakdown: { accuracy: 80, completeness: 80, clarity: 80, depth: 80 },
          feedback: "",
          matchedPoints: [],
          missedPoints: [],
        },
        {
          questionId: "q2",
          score: 100,
          maxScore: 100,
          breakdown: { accuracy: 100, completeness: 100, clarity: 100, depth: 100 },
          feedback: "",
          matchedPoints: [],
          missedPoints: [],
        },
      ]);

      expect(result.overall).toBe(90);
      expect(result.dimensions.accuracy).toBe(90);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExamSessionManager } from "../session";

// Mock the exam-store to use in-memory Map instead of file
const store = new Map<string, any>();

vi.mock("@/lib/exam-store", () => ({
  getExam: vi.fn(async (id: string) => store.get(id) || undefined),
  addExam: vi.fn(async (exam: any) => { store.set(exam.id, { ...exam }); }),
  updateExam: vi.fn(async (id: string, data: any) => {
    const existing = store.get(id);
    if (existing) store.set(id, { ...existing, ...data });
  }),
  getRepos: vi.fn(async () => []),
}));

describe("ExamSessionManager", () => {
  let manager: ExamSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    manager = new ExamSessionManager();
  });

  describe("createSession", () => {
    it("should create a new session", async () => {
      const session = await manager.createSession(
        "test-1",
        "repo-1",
        "viva",
        "intermediate"
      );

      expect(session.id).toBe("test-1");
      expect(session.repositoryId).toBe("repo-1");
      expect(session.mode).toBe("viva");
      expect(session.status).toBe("pending");
    });
  });

  describe("session lifecycle", () => {
    it("should start session", async () => {
      await manager.createSession("test-2", "repo-1", "viva");
      const session = await manager.startSession("test-2");

      expect(session?.status).toBe("active");
      expect(session?.startedAt).toBeDefined();
    });

    it("should pause session", async () => {
      await manager.createSession("test-3", "repo-1", "viva");
      await manager.startSession("test-3");
      const session = await manager.pauseSession("test-3");

      expect(session?.status).toBe("paused");
    });

    it("should resume session", async () => {
      await manager.createSession("test-4", "repo-1", "viva");
      await manager.startSession("test-4");
      await manager.pauseSession("test-4");
      const session = await manager.resumeSession("test-4");

      expect(session?.status).toBe("active");
    });

    it("should complete session", async () => {
      await manager.createSession("test-5", "repo-1", "viva");
      await manager.startSession("test-5");
      const session = await manager.completeSession("test-5");

      expect(session?.status).toBe("completed");
      expect(session?.completedAt).toBeDefined();
    });

    it("should cancel session", async () => {
      await manager.createSession("test-6", "repo-1", "viva");
      const session = await manager.cancelSession("test-6");

      expect(session?.status).toBe("cancelled");
    });
  });

  describe("question management", () => {
    it("should add questions", async () => {
      await manager.createSession("test-7", "repo-1", "viva");
      await manager.addQuestion("test-7", {
        id: "q1",
        question: "What is this?",
        type: "conceptual",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: ["point1"],
      });

      const session = await manager.getSession("test-7");
      expect(session?.questions).toHaveLength(1);
    });

    it("should get current question", async () => {
      await manager.createSession("test-8", "repo-1", "viva");
      await manager.addQuestion("test-8", {
        id: "q1",
        question: "Question 1",
        type: "conceptual",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: [],
      });
      await manager.addQuestion("test-8", {
        id: "q2",
        question: "Question 2",
        type: "implementation",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: [],
      });
      await manager.startSession("test-8");

      const current = await manager.getCurrentQuestion("test-8");
      expect(current?.id).toBe("q1");
    });
  });

  describe("progress tracking", () => {
    it("should track progress", async () => {
      await manager.createSession("test-9", "repo-1", "viva");
      await manager.addQuestion("test-9", {
        id: "q1",
        question: "Q1",
        type: "conceptual",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: [],
      });
      await manager.addQuestion("test-9", {
        id: "q2",
        question: "Q2",
        type: "conceptual",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: [],
      });
      await manager.startSession("test-9");
      await manager.addAnswer("test-9", {
        questionId: "q1",
        answer: "Answer 1",
        timestamp: new Date(),
        timeSpentMs: 5000,
      });

      const progress = await manager.getProgress("test-9");

      expect(progress?.current).toBe(1);
      expect(progress?.total).toBe(2);
      expect(progress?.percentage).toBe(50);
    });
  });

  describe("score calculation", () => {
    it("should calculate total score on completion", async () => {
      await manager.createSession("test-10", "repo-1", "viva");
      await manager.addQuestion("test-10", {
        id: "q1",
        question: "Q1",
        type: "conceptual",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: [],
      });
      await manager.startSession("test-10");
      await manager.addAnswer("test-10", {
        questionId: "q1",
        answer: "Answer",
        timestamp: new Date(),
        timeSpentMs: 5000,
      });
      await manager.addEvaluation("test-10", {
        questionId: "q1",
        score: 85,
        maxScore: 100,
        breakdown: { accuracy: 80, completeness: 90, clarity: 85, depth: 85 },
        feedback: "Good",
        matchedPoints: [],
        missedPoints: [],
      });
      await manager.completeSession("test-10");

      const session = await manager.getSession("test-10");
      expect(session?.totalScore).toBe(85);
      expect(session?.maxTotalScore).toBe(100);
    });
  });
});

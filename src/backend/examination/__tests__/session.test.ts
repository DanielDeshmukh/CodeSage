import { describe, it, expect, beforeEach } from "vitest";
import { ExamSessionManager } from "../session";

describe("ExamSessionManager", () => {
  let manager: ExamSessionManager;

  beforeEach(() => {
    manager = new ExamSessionManager();
  });

  describe("createSession", () => {
    it("should create a new session", () => {
      const session = manager.createSession(
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
    it("should start session", () => {
      manager.createSession("test-1", "repo-1", "viva");
      const session = manager.startSession("test-1");

      expect(session?.status).toBe("active");
      expect(session?.startedAt).toBeDefined();
    });

    it("should pause session", () => {
      manager.createSession("test-1", "repo-1", "viva");
      manager.startSession("test-1");
      const session = manager.pauseSession("test-1");

      expect(session?.status).toBe("paused");
    });

    it("should resume session", () => {
      manager.createSession("test-1", "repo-1", "viva");
      manager.startSession("test-1");
      manager.pauseSession("test-1");
      const session = manager.resumeSession("test-1");

      expect(session?.status).toBe("active");
    });

    it("should complete session", () => {
      manager.createSession("test-1", "repo-1", "viva");
      manager.startSession("test-1");
      const session = manager.completeSession("test-1");

      expect(session?.status).toBe("completed");
      expect(session?.completedAt).toBeDefined();
    });

    it("should cancel session", () => {
      manager.createSession("test-1", "repo-1", "viva");
      const session = manager.cancelSession("test-1");

      expect(session?.status).toBe("cancelled");
    });
  });

  describe("question management", () => {
    it("should add questions", () => {
      manager.createSession("test-1", "repo-1", "viva");
      manager.addQuestion("test-1", {
        id: "q1",
        question: "What is this?",
        type: "conceptual",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: ["point1"],
      });

      const session = manager.getSession("test-1");
      expect(session?.questions).toHaveLength(1);
    });

    it("should get current question", () => {
      manager.createSession("test-1", "repo-1", "viva");
      manager.addQuestion("test-1", {
        id: "q1",
        question: "Question 1",
        type: "conceptual",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: [],
      });
      manager.addQuestion("test-1", {
        id: "q2",
        question: "Question 2",
        type: "implementation",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: [],
      });
      manager.startSession("test-1");

      const current = manager.getCurrentQuestion("test-1");
      expect(current?.id).toBe("q1");
    });
  });

  describe("progress tracking", () => {
    it("should track progress", () => {
      manager.createSession("test-1", "repo-1", "viva");
      manager.addQuestion("test-1", {
        id: "q1",
        question: "Q1",
        type: "conceptual",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: [],
      });
      manager.addQuestion("test-1", {
        id: "q2",
        question: "Q2",
        type: "conceptual",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: [],
      });
      manager.startSession("test-1");
      manager.addAnswer("test-1", {
        questionId: "q1",
        answer: "Answer 1",
        timestamp: new Date(),
        timeSpentMs: 5000,
      });

      const progress = manager.getProgress("test-1");

      expect(progress?.current).toBe(1);
      expect(progress?.total).toBe(2);
      expect(progress?.percentage).toBe(50);
    });
  });

  describe("score calculation", () => {
    it("should calculate total score on completion", () => {
      manager.createSession("test-1", "repo-1", "viva");
      manager.addQuestion("test-1", {
        id: "q1",
        question: "Q1",
        type: "conceptual",
        difficulty: "intermediate",
        context: { filePath: "test.ts", language: "typescript", chunkName: "test" },
        expectedPoints: [],
      });
      manager.startSession("test-1");
      manager.addAnswer("test-1", {
        questionId: "q1",
        answer: "Answer",
        timestamp: new Date(),
        timeSpentMs: 5000,
      });
      manager.addEvaluation("test-1", {
        questionId: "q1",
        score: 85,
        maxScore: 100,
        breakdown: { accuracy: 80, completeness: 90, clarity: 85, depth: 85 },
        feedback: "Good",
        matchedPoints: [],
        missedPoints: [],
      });
      manager.completeSession("test-1");

      const session = manager.getSession("test-1");
      expect(session?.totalScore).toBe(85);
      expect(session?.maxTotalScore).toBe(100);
    });
  });
});

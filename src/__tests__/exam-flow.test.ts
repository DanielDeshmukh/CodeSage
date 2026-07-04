import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExamSessionManager } from "@/backend/examination/session";
import { QuestionGenerator } from "@/backend/examination/question-generator";
import { AnswerEvaluator } from "@/backend/examination/answer-evaluator";

// Mock exam-store with in-memory Map
const store = new Map<string, any>();

vi.mock("@/lib/exam-store", () => ({
  getExam: vi.fn(async (id: string) => store.get(id) || undefined),
  addExam: vi.fn(async (exam: any) => { store.set(exam.id, { ...exam }); }),
  updateExam: vi.fn(async (id: string, data: any) => {
    const existing = store.get(id);
    if (existing) store.set(id, { ...existing, ...data });
  }),
}));

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

describe("Exam Flow Integration", () => {
  let sessionManager: ExamSessionManager;
  let questionGenerator: QuestionGenerator;
  let answerEvaluator: AnswerEvaluator;

  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    sessionManager = new ExamSessionManager();
    questionGenerator = new QuestionGenerator();
    answerEvaluator = new AnswerEvaluator();
  });

  it("should complete full exam session lifecycle", async () => {
    const session = await sessionManager.createSession(
      "exam-1",
      "repo-1",
      "viva",
      "intermediate"
    );

    expect(session.status).toBe("pending");
    expect(session.repositoryId).toBe("repo-1");

    const started = await sessionManager.startSession("exam-1");
    expect(started?.status).toBe("active");
    expect(started?.startedAt).toBeDefined();

    await sessionManager.addQuestion("exam-1", {
      id: "q1",
      question: "What is the architecture of this project?",
      type: "conceptual",
      difficulty: "intermediate",
      context: {
        filePath: "src/app.ts",
        language: "typescript",
        chunkName: "app",
      },
      expectedPoints: ["MVC pattern", "Service layer"],
    });

    const progress1 = await sessionManager.getProgress("exam-1");
    expect(progress1?.current).toBe(0);
    expect(progress1?.total).toBe(1);

    await sessionManager.addAnswer("exam-1", {
      questionId: "q1",
      answer: "The project uses MVC pattern with a service layer.",
      timestamp: new Date(),
      timeSpentMs: 15000,
    });

    const progress2 = await sessionManager.getProgress("exam-1");
    expect(progress2?.current).toBe(1);

    await sessionManager.addEvaluation("exam-1", {
      questionId: "q1",
      score: 90,
      maxScore: 100,
      breakdown: { accuracy: 85, completeness: 95, clarity: 90, depth: 90 },
      feedback: "Excellent understanding of architecture",
      matchedPoints: ["MVC pattern", "Service layer"],
      missedPoints: [],
    });

    const completed = await sessionManager.completeSession("exam-1");
    expect(completed?.status).toBe("completed");
    expect(completed?.totalScore).toBe(90);
    expect(completed?.completedAt).toBeDefined();
  });

  it("should handle pause and resume during exam", async () => {
    await sessionManager.createSession("exam-2", "repo-1", "interview", "advanced");
    await sessionManager.startSession("exam-2");

    await sessionManager.addQuestion("exam-2", {
      id: "q1",
      question: "Explain the algorithm used.",
      type: "implementation",
      difficulty: "advanced",
      context: {
        filePath: "src/algo.ts",
        language: "typescript",
        chunkName: "algo",
      },
      expectedPoints: ["O(n) complexity"],
    });

    const paused = await sessionManager.pauseSession("exam-2");
    expect(paused?.status).toBe("paused");

    const currentDuringPause = await sessionManager.getCurrentQuestion("exam-2");
    expect(currentDuringPause).toBeDefined();

    const resumed = await sessionManager.resumeSession("exam-2");
    expect(resumed?.status).toBe("active");
  });

  it("should evaluate answer and calculate scores", async () => {
    const mockChat = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              score: 88,
              breakdown: {
                accuracy: 85,
                completeness: 90,
                clarity: 88,
                depth: 89,
              },
              feedback: "Strong answer with good depth",
              matchedPoints: ["MVC pattern"],
              missedPoints: ["Service layer"],
            }),
          },
        },
      ],
    });

    const evaluator = new AnswerEvaluator();
    (evaluator as any).client.chat = mockChat;

    const evaluation = await evaluator.evaluate({
      question: {
        id: "q1",
        question: "Describe architecture",
        type: "conceptual",
        difficulty: "intermediate",
        context: {
          filePath: "app.ts",
          language: "typescript",
          chunkName: "app",
        },
        expectedPoints: ["MVC pattern", "Service layer"],
      },
      answer: "Uses MVC with services",
      context: {
        repositoryId: "repo-1",
        language: "typescript",
        filePath: "app.ts",
        chunkName: "app",
        codeContent: "test code",
      },
    });

    expect(evaluation.score).toBe(88);
    expect(evaluation.feedback).toContain("Strong answer");

    const overall = evaluator.calculateOverallScore([evaluation]);
    expect(overall.overall).toBe(88);
  });
});

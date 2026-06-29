import type { Repository, ExamSession, ExamQuestion, ScoreReport } from "@/types";

// ============================================================================
// Mock Data
// ============================================================================

const mockRepositories: Repository[] = [
  {
    id: "1",
    name: "codesage",
    fullName: "DanielDeshmukh/CodeSage",
    url: "https://github.com/DanielDeshmukh/CodeSage",
    description: "AI-powered codebase examiner",
    defaultBranch: "main",
    language: "TypeScript",
    stars: 12,
    forks: 2,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-28T00:00:00Z",
    ingestedAt: "2026-06-28T10:00:00Z",
    status: "ready",
    stats: {
      totalFiles: 47,
      sourceFiles: 32,
      totalLines: 3240,
      languages: [
        { language: "TypeScript", files: 28, lines: 2800, percentage: 86 },
        { language: "CSS", files: 4, lines: 440, percentage: 14 },
      ],
      chunks: 156,
    },
  },
  {
    id: "2",
    name: "next.js",
    fullName: "vercel/next.js",
    url: "https://github.com/vercel/next.js",
    description: "The React Framework for the Web",
    defaultBranch: "canary",
    language: "TypeScript",
    stars: 128000,
    forks: 27000,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-06-28T00:00:00Z",
    ingestedAt: "2026-06-27T15:00:00Z",
    status: "ready",
    stats: {
      totalFiles: 2500,
      sourceFiles: 1800,
      totalLines: 450000,
      languages: [
        { language: "TypeScript", files: 1500, lines: 380000, percentage: 84 },
        { language: "JavaScript", files: 300, lines: 70000, percentage: 16 },
      ],
      chunks: 4521,
    },
  },
];

const mockSessions: ExamSession[] = [
  {
    id: "1",
    repositoryId: "1",
    mode: "viva",
    status: "completed",
    startedAt: "2026-06-28T10:00:00Z",
    completedAt: "2026-06-28T10:30:00Z",
    currentQuestionIndex: 10,
    totalQuestions: 10,
    questions: [],
    scores: {
      architecture: 85,
      codeDetail: 72,
      scalability: 68,
      overall: 75,
    },
  },
];

// ============================================================================
// Mock API Service
// ============================================================================

export const mockApi = {
  // Repository operations
  repositories: {
    list: async (): Promise<Repository[]> => {
      await delay(300);
      return mockRepositories;
    },

    get: async (id: string): Promise<Repository | undefined> => {
      await delay(200);
      return mockRepositories.find((r) => r.id === id);
    },

    create: async (url: string): Promise<Repository> => {
      await delay(1000);
      const repo: Repository = {
        id: String(Date.now()),
        name: url.split("/").pop() || "repo",
        fullName: url.replace("https://github.com/", ""),
        url,
        description: null,
        defaultBranch: "main",
        language: "TypeScript",
        stars: 0,
        forks: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ingestedAt: null,
        status: "pending",
        stats: {
          totalFiles: 0,
          sourceFiles: 0,
          totalLines: 0,
          languages: [],
          chunks: 0,
        },
      };
      mockRepositories.push(repo);
      return repo;
    },

    delete: async (id: string): Promise<void> => {
      await delay(300);
      const index = mockRepositories.findIndex((r) => r.id === id);
      if (index !== -1) {
        mockRepositories.splice(index, 1);
      }
    },
  },

  // Exam operations
  exams: {
    list: async (): Promise<ExamSession[]> => {
      await delay(300);
      return mockSessions;
    },

    get: async (id: string): Promise<ExamSession | undefined> => {
      await delay(200);
      return mockSessions.find((s) => s.id === id);
    },

    create: async (
      repositoryId: string,
      mode: string
    ): Promise<ExamSession> => {
      await delay(500);
      const session: ExamSession = {
        id: String(Date.now()),
        repositoryId,
        mode: mode as ExamSession["mode"],
        status: "pending",
        startedAt: new Date().toISOString(),
        completedAt: null,
        currentQuestionIndex: 0,
        totalQuestions: 10,
        questions: [],
        scores: {
          architecture: 0,
          codeDetail: 0,
          scalability: 0,
          overall: 0,
        },
      };
      mockSessions.push(session);
      return session;
    },

    answer: async (
      sessionId: string,
      questionId: string,
      answer: string
    ): Promise<{ success: boolean }> => {
      await delay(1000);
      return { success: true };
    },
  },

  // Score operations
  scores: {
    get: async (sessionId: string): Promise<ScoreReport | null> => {
      await delay(300);
      const session = mockSessions.find((s) => s.id === sessionId);
      if (!session) return null;

      return {
        id: `report-${sessionId}`,
        sessionId,
        repositoryId: session.repositoryId,
        scores: session.scores,
        questionBreakdown: [],
        studyGuide: [],
        generatedAt: new Date().toISOString(),
      };
    },
  },
};

// Helper function to simulate network delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

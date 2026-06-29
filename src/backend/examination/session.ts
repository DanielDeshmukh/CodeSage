export type ExamMode = "viva" | "interview" | "code-review";
export type ExamStatus = "pending" | "active" | "paused" | "completed" | "cancelled";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface ExamQuestion {
  id: string;
  question: string;
  type: "conceptual" | "implementation" | "architecture" | "best-practice";
  difficulty: Difficulty;
  context: {
    filePath: string;
    language: string;
    chunkName: string;
  };
  expectedPoints: string[];
  followUp?: string;
}

export interface ExamAnswer {
  questionId: string;
  answer: string;
  timestamp: Date;
  timeSpentMs: number;
}

export interface ExamEvaluation {
  questionId: string;
  score: number;
  maxScore: number;
  breakdown: {
    accuracy: number;
    completeness: number;
    clarity: number;
    depth: number;
  };
  feedback: string;
  matchedPoints: string[];
  missedPoints: string[];
}

export interface ExamSession {
  id: string;
  repositoryId: string;
  mode: ExamMode;
  difficulty: Difficulty;
  status: ExamStatus;
  questions: ExamQuestion[];
  answers: ExamAnswer[];
  evaluations: ExamEvaluation[];
  currentQuestionIndex: number;
  startedAt: Date | null;
  completedAt: Date | null;
  totalScore: number;
  maxTotalScore: number;
  timeLimitMs: number;
  elapsedMs: number;
}

export class ExamSessionManager {
  private sessions = new Map<string, ExamSession>();

  createSession(
    id: string,
    repositoryId: string,
    mode: ExamMode,
    difficulty: Difficulty = "intermediate",
    timeLimitMs: number = 1800000
  ): ExamSession {
    const session: ExamSession = {
      id,
      repositoryId,
      mode,
      difficulty,
      status: "pending",
      questions: [],
      answers: [],
      evaluations: [],
      currentQuestionIndex: 0,
      startedAt: null,
      completedAt: null,
      totalScore: 0,
      maxTotalScore: 0,
      timeLimitMs,
      elapsedMs: 0,
    };

    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): ExamSession | null {
    return this.sessions.get(id) || null;
  }

  startSession(id: string): ExamSession | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    session.status = "active";
    session.startedAt = new Date();
    return session;
  }

  pauseSession(id: string): ExamSession | null {
    const session = this.sessions.get(id);
    if (!session || session.status !== "active") return null;

    session.status = "paused";
    session.elapsedMs += Date.now() - (session.startedAt?.getTime() || 0);
    return session;
  }

  resumeSession(id: string): ExamSession | null {
    const session = this.sessions.get(id);
    if (!session || session.status !== "paused") return null;

    session.status = "active";
    session.startedAt = new Date();
    return session;
  }

  completeSession(id: string): ExamSession | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    session.status = "completed";
    session.completedAt = new Date();
    if (session.startedAt) {
      session.elapsedMs += Date.now() - session.startedAt.getTime();
    }

    // Calculate total score
    session.totalScore = session.evaluations.reduce((sum, e) => sum + e.score, 0);
    session.maxTotalScore = session.evaluations.reduce((sum, e) => sum + e.maxScore, 0);

    return session;
  }

  cancelSession(id: string): ExamSession | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    session.status = "cancelled";
    session.completedAt = new Date();
    return session;
  }

  addQuestion(id: string, question: ExamQuestion): ExamSession | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    session.questions.push(question);
    return session;
  }

  addAnswer(id: string, answer: ExamAnswer): ExamSession | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    session.answers.push(answer);
    session.currentQuestionIndex++;
    return session;
  }

  addEvaluation(id: string, evaluation: ExamEvaluation): ExamSession | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    session.evaluations.push(evaluation);
    return session;
  }

  getCurrentQuestion(id: string): ExamQuestion | null {
    const session = this.sessions.get(id);
    if (!session || session.currentQuestionIndex >= session.questions.length) {
      return null;
    }
    return session.questions[session.currentQuestionIndex];
  }

  getProgress(id: string): {
    current: number;
    total: number;
    percentage: number;
    score: number;
    maxScore: number;
  } | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    const total = session.questions.length;
    const current = session.currentQuestionIndex;
    const score = session.evaluations.reduce((sum, e) => sum + e.score, 0);
    const maxScore = session.evaluations.reduce((sum, e) => sum + e.maxScore, 0);

    return {
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
      score,
      maxScore,
    };
  }

  getSessionsByRepository(repositoryId: string): ExamSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.repositoryId === repositoryId
    );
  }

  deleteSession(id: string): boolean {
    return this.sessions.delete(id);
  }
}

let instance: ExamSessionManager | null = null;

export function getExamSessionManager(): ExamSessionManager {
  if (!instance) {
    instance = new ExamSessionManager();
  }
  return instance;
}

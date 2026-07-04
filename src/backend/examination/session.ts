import {
  getExam,
  addExam,
  updateExam,
  type ExamRecord,
} from "@/lib/exam-store";

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

function recordToSession(record: ExamRecord): ExamSession {
  return {
    id: record.id,
    repositoryId: record.repositoryId,
    mode: record.mode as ExamMode,
    difficulty: record.difficulty as Difficulty,
    status: record.status as ExamStatus,
    questions: (record.questions || []) as ExamQuestion[],
    answers: (record.answers || []) as ExamAnswer[],
    evaluations: (record.evaluations || []) as ExamEvaluation[],
    currentQuestionIndex: (record.answers || []).length,
    startedAt: record.startedAt ? new Date(record.startedAt) : null,
    completedAt: record.completedAt ? new Date(record.completedAt) : null,
    totalScore: record.totalScore || 0,
    maxTotalScore: record.maxTotalScore || 0,
    timeLimitMs: 1800000,
    elapsedMs: 0,
  };
}

function sessionToRecord(session: ExamSession): ExamRecord {
  return {
    id: session.id,
    repositoryId: session.repositoryId,
    mode: session.mode,
    difficulty: session.difficulty,
    status: session.status,
    totalScore: session.totalScore,
    maxTotalScore: session.maxTotalScore,
    questions: session.questions,
    answers: session.answers,
    evaluations: session.evaluations,
    startedAt: session.startedAt?.toISOString() || new Date().toISOString(),
    completedAt: session.completedAt?.toISOString() || null,
  };
}

export class ExamSessionManager {
  async createSession(
    id: string,
    repositoryId: string,
    mode: ExamMode,
    difficulty: Difficulty = "intermediate",
    timeLimitMs: number = 1800000
  ): Promise<ExamSession> {
    const record: ExamRecord = {
      id,
      repositoryId,
      mode,
      difficulty,
      status: "pending",
      totalScore: 0,
      maxTotalScore: 0,
      questions: [],
      answers: [],
      evaluations: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    await addExam(record);
    return recordToSession(record);
  }

  async getSession(id: string): Promise<ExamSession | null> {
    const record = await getExam(id);
    return record ? recordToSession(record) : null;
  }

  async startSession(id: string): Promise<ExamSession | null> {
    await updateExam(id, { status: "active", startedAt: new Date().toISOString() });
    return this.getSession(id);
  }

  async pauseSession(id: string): Promise<ExamSession | null> {
    await updateExam(id, { status: "paused" });
    return this.getSession(id);
  }

  async resumeSession(id: string): Promise<ExamSession | null> {
    await updateExam(id, { status: "active" });
    return this.getSession(id);
  }

  async completeSession(id: string): Promise<ExamSession | null> {
    const record = await getExam(id);
    if (!record) return null;

    const evaluations = (record.evaluations || []) as ExamEvaluation[];
    const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0);
    const maxTotalScore = evaluations.reduce((sum, e) => sum + e.maxScore, 0);

    await updateExam(id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      totalScore,
      maxTotalScore,
    });

    return this.getSession(id);
  }

  async cancelSession(id: string): Promise<ExamSession | null> {
    await updateExam(id, { status: "cancelled", completedAt: new Date().toISOString() });
    return this.getSession(id);
  }

  async addQuestion(id: string, question: ExamQuestion): Promise<ExamSession | null> {
    const session = await this.getSession(id);
    if (!session) return null;

    session.questions.push(question);
    await updateExam(id, { questions: session.questions });
    return session;
  }

  async addAnswer(id: string, answer: ExamAnswer): Promise<ExamSession | null> {
    const session = await this.getSession(id);
    if (!session) return null;

    session.answers.push(answer);
    session.currentQuestionIndex++;
    await updateExam(id, { answers: session.answers });
    return session;
  }

  async addEvaluation(id: string, evaluation: ExamEvaluation): Promise<ExamSession | null> {
    const session = await this.getSession(id);
    if (!session) return null;

    session.evaluations.push(evaluation);
    await updateExam(id, { evaluations: session.evaluations });
    return session;
  }

  async getCurrentQuestion(id: string): Promise<ExamQuestion | null> {
    const session = await this.getSession(id);
    if (!session || session.currentQuestionIndex >= session.questions.length) {
      return null;
    }
    return session.questions[session.currentQuestionIndex];
  }

  async getProgress(id: string): Promise<{
    current: number;
    total: number;
    percentage: number;
    score: number;
    maxScore: number;
  } | null> {
    const session = await this.getSession(id);
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

  async deleteSession(id: string): Promise<boolean> {
    const session = await this.getSession(id);
    if (!session) return false;
    await updateExam(id, { status: "cancelled" });
    return true;
  }
}

let instance: ExamSessionManager | null = null;

export function getExamSessionManager(): ExamSessionManager {
  if (!instance) {
    instance = new ExamSessionManager();
  }
  return instance;
}

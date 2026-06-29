import { v4 as uuidv4 } from "uuid";
import {
  getExamSessionManager,
  type ExamSession,
  type ExamMode,
  type Difficulty,
  type ExamQuestion,
  type ExamAnswer,
  type ExamEvaluation,
} from "./session";
import { getQuestionGenerator, type GeneratedQuestion } from "./question-generator";
import { getAnswerEvaluator } from "./answer-evaluator";
import { getFeedbackGenerator, type FeedbackResult } from "./feedback-generator";
import { getFollowUpGenerator } from "./follow-up-generator";
import { getSafetyService } from "@/ai/nim/safety";

export interface ExamLoopOptions {
  repositoryId: string;
  mode: ExamMode;
  difficulty?: Difficulty;
  questionCount?: number;
  timeLimitMs?: number;
}

export interface ExamLoopResult {
  session: ExamSession;
  feedback: FeedbackResult;
  overallScore: number;
  dimensionScores: {
    accuracy: number;
    completeness: number;
    clarity: number;
    depth: number;
  };
}

export class ExamLoop {
  private sessionManager = getExamSessionManager();
  private questionGenerator = getQuestionGenerator();
  private answerEvaluator = getAnswerEvaluator();
  private feedbackGenerator = getFeedbackGenerator();
  private followUpGenerator = getFollowUpGenerator();
  private safetyService = getSafetyService();

  private onQuestion?: (question: ExamQuestion) => void;
  private onEvaluation?: (evaluation: ExamEvaluation) => void;
  private onProgress?: (progress: {
    current: number;
    total: number;
    score: number;
  }) => void;

  setCallbacks(callbacks: {
    onQuestion?: (question: ExamQuestion) => void;
    onEvaluation?: (evaluation: ExamEvaluation) => void;
    onProgress?: (progress: { current: number; total: number; score: number }) => void;
  }): void {
    this.onQuestion = callbacks.onQuestion;
    this.onEvaluation = callbacks.onEvaluation;
    this.onProgress = callbacks.onProgress;
  }

  async startExam(options: ExamLoopOptions): Promise<ExamSession> {
    const sessionId = uuidv4();
    const session = this.sessionManager.createSession(
      sessionId,
      options.repositoryId,
      options.mode,
      options.difficulty,
      options.timeLimitMs
    );

    // Generate initial questions
    const questions = await this.questionGenerator.generateQuestionSet(
      {
        repositoryId: options.repositoryId,
        mode: options.mode,
        difficulty: options.difficulty || "intermediate",
      },
      options.questionCount || 5
    );

    for (const question of questions) {
      this.sessionManager.addQuestion(sessionId, question);
    }

    // Start the session
    this.sessionManager.startSession(sessionId);

    return this.sessionManager.getSession(sessionId)!;
  }

  async submitAnswer(
    sessionId: string,
    answer: string
  ): Promise<{
    evaluation: ExamEvaluation;
    followUp: ExamQuestion | null;
    isComplete: boolean;
  }> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Safety check on answer
    const safetyResult = await this.safetyService.checkContent({
      content: answer,
      context: "user-input",
    });

    if (!safetyResult.isSafe) {
      return {
        evaluation: {
          questionId: session.questions[session.currentQuestionIndex]?.id || "",
          score: 0,
          maxScore: 100,
          breakdown: { accuracy: 0, completeness: 0, clarity: 0, depth: 0 },
          feedback: "Answer was flagged by safety filter. Please provide appropriate content.",
          matchedPoints: [],
          missedPoints: [],
        },
        followUp: null,
        isComplete: false,
      };
    }

    // Record answer
    const currentQuestion = session.questions[session.currentQuestionIndex];
    const answerRecord: ExamAnswer = {
      questionId: currentQuestion.id,
      answer,
      timestamp: new Date(),
      timeSpentMs: 0,
    };
    this.sessionManager.addAnswer(sessionId, answerRecord);

    // Evaluate answer
    const evaluation = await this.answerEvaluator.evaluate({
      question: currentQuestion,
      answer,
      context: {
        repositoryId: session.repositoryId,
        language: currentQuestion.context.language,
        filePath: currentQuestion.context.filePath,
        chunkName: currentQuestion.context.chunkName,
        codeContent: "",
      },
    });

    this.sessionManager.addEvaluation(sessionId, evaluation);
    this.onEvaluation?.(evaluation);

    // Check if should generate follow-up
    let followUp: ExamQuestion | null = null;
    if (evaluation.score < 70) {
      const followUpResult = await this.followUpGenerator.generateProbingFollowUp(
        currentQuestion.question,
        answer,
        evaluation.score,
        {
          repositoryId: session.repositoryId,
          language: currentQuestion.context.language,
          filePath: currentQuestion.context.filePath,
          chunkName: currentQuestion.context.chunkName,
          codeContent: "",
        }
      );

      if (followUpResult) {
        followUp = {
          id: uuidv4(),
          question: followUpResult.question,
          type: "conceptual",
          difficulty: currentQuestion.difficulty,
          context: currentQuestion.context,
          expectedPoints: [],
        };
      }
    }

    // Check if exam is complete
    const isComplete =
      session.currentQuestionIndex >= session.questions.length;

    if (isComplete) {
      this.sessionManager.completeSession(sessionId);
    }

    // Report progress
    const progress = this.sessionManager.getProgress(sessionId);
    if (progress) {
      this.onProgress?.({
        current: progress.current,
        total: progress.total,
        score: progress.score,
      });
    }

    return { evaluation, followUp, isComplete };
  }

  async completeExam(sessionId: string): Promise<ExamLoopResult> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Generate final feedback
    const feedback = await this.feedbackGenerator.generateFeedback(
      session.mode,
      session.evaluations,
      session.totalScore
    );

    // Calculate dimension scores
    const { overall, dimensions } =
      this.answerEvaluator.calculateOverallScore(session.evaluations);

    return {
      session,
      feedback,
      overallScore: overall,
      dimensionScores: dimensions,
    };
  }

  getExamStatus(sessionId: string): {
    progress: number;
    score: number;
    timeRemaining: number;
  } | null {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) return null;

    const progress = this.sessionManager.getProgress(sessionId);
    if (!progress) return null;

    const elapsed = session.elapsedMs;
    const remaining = Math.max(0, session.timeLimitMs - elapsed);

    return {
      progress: progress.percentage,
      score: progress.score,
      timeRemaining: remaining,
    };
  }
}

let instance: ExamLoop | null = null;

export function getExamLoop(): ExamLoop {
  if (!instance) {
    instance = new ExamLoop();
  }
  return instance;
}

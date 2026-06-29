import { v4 as uuidv4 } from "uuid";
import type {
  ExamSession,
  ExamQuestion,
  ExamAnswer,
  ExamMode,
  ExamStatus,
  AnswerEvaluation,
  ExamScores,
  QuestionScore,
  StudyGuideItem,
} from "@/types";

// ============================================================================
// Exam Session Store (In-Memory for now, will be replaced with database)
// ============================================================================

const sessions = new Map<string, ExamSession>();
const questions = new Map<string, ExamQuestion>();
const answers = new Map<string, ExamAnswer>();

// --------------------------------------------------------------------------
// Session Operations
// --------------------------------------------------------------------------

export function createSession(
  repositoryId: string,
  mode: ExamMode,
  totalQuestions: number = 10
): ExamSession {
  const session: ExamSession = {
    id: uuidv4(),
    repositoryId,
    mode,
    status: "pending",
    startedAt: new Date().toISOString(),
    completedAt: null,
    currentQuestionIndex: 0,
    totalQuestions,
    questions: [],
    scores: {
      architecture: 0,
      codeDetail: 0,
      scalability: 0,
      overall: 0,
    },
  };

  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string): ExamSession | null {
  return sessions.get(sessionId) || null;
}

export function getSessionsByRepository(repositoryId: string): ExamSession[] {
  return Array.from(sessions.values()).filter(
    (s) => s.repositoryId === repositoryId
  );
}

export function updateSessionStatus(
  sessionId: string,
  status: ExamStatus
): ExamSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.status = status;
  if (status === "completed") {
    session.completedAt = new Date().toISOString();
  }

  sessions.set(sessionId, session);
  return session;
}

export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

// --------------------------------------------------------------------------
// Question Operations
// --------------------------------------------------------------------------

export function createQuestion(
  sessionId: string,
  chunkId: string,
  questionText: string,
  filePath: string,
  functionName: string | null,
  lineNumber: number
): ExamQuestion {
  const question: ExamQuestion = {
    id: uuidv4(),
    sessionId,
    chunkId,
    question: questionText,
    filePath,
    functionName,
    lineNumber,
    askedAt: new Date().toISOString(),
    answer: null,
  };

  questions.set(question.id, question);

  // Add to session
  const session = sessions.get(sessionId);
  if (session) {
    session.questions.push(question);
    sessions.set(sessionId, session);
  }

  return question;
}

export function getQuestion(questionId: string): ExamQuestion | null {
  return questions.get(questionId) || null;
}

export function getQuestionsBySession(sessionId: string): ExamQuestion[] {
  return Array.from(questions.values()).filter(
    (q) => q.sessionId === sessionId
  );
}

// --------------------------------------------------------------------------
// Answer Operations
// --------------------------------------------------------------------------

export function createAnswer(
  questionId: string,
  content: string
): ExamAnswer | null {
  const question = questions.get(questionId);
  if (!question) return null;

  const answer: ExamAnswer = {
    id: uuidv4(),
    questionId,
    content,
    answeredAt: new Date().toISOString(),
    evaluation: null,
  };

  answers.set(answer.id, answer);
  question.answer = answer;
  questions.set(questionId, question);

  return answer;
}

export function getAnswer(answerId: string): ExamAnswer | null {
  return answers.get(answerId) || null;
}

export function getAnswerByQuestion(questionId: string): ExamAnswer | null {
  return (
    Array.from(answers.values()).find((a) => a.questionId === questionId) ||
    null
  );
}

export function updateAnswerEvaluation(
  answerId: string,
  evaluation: AnswerEvaluation
): ExamAnswer | null {
  const answer = answers.get(answerId);
  if (!answer) return null;

  answer.evaluation = evaluation;
  answers.set(answerId, answer);

  // Update the question's answer
  const question = questions.get(answer.questionId);
  if (question) {
    question.answer = answer;
    questions.set(answer.questionId, question);
  }

  return answer;
}

// --------------------------------------------------------------------------
// Score Operations
// --------------------------------------------------------------------------

export function calculateSessionScores(sessionId: string): ExamScores | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const evaluatedAnswers = session.questions
    .filter((q) => q.answer?.evaluation)
    .map((q) => q.answer!.evaluation!);

  if (evaluatedAnswers.length === 0) {
    return {
      architecture: 0,
      codeDetail: 0,
      scalability: 0,
      overall: 0,
    };
  }

  const avgAccuracy =
    evaluatedAnswers.reduce((sum, e) => sum + e.accuracy, 0) /
    evaluatedAnswers.length;
  const avgDepth =
    evaluatedAnswers.reduce((sum, e) => sum + e.depth, 0) /
    evaluatedAnswers.length;
  const avgAwareness =
    evaluatedAnswers.reduce((sum, e) => sum + e.awareness, 0) /
    evaluatedAnswers.length;

  const scores: ExamScores = {
    architecture: avgAccuracy,
    codeDetail: avgDepth,
    scalability: avgAwareness,
    overall: (avgAccuracy + avgDepth + avgAwareness) / 3,
  };

  session.scores = scores;
  sessions.set(sessionId, session);

  return scores;
}

export function getQuestionScores(sessionId: string): QuestionScore[] {
  const session = sessions.get(sessionId);
  if (!session) return [];

  return session.questions
    .filter((q) => q.answer?.evaluation)
    .map((q) => ({
      questionId: q.id,
      question: q.question,
      filePath: q.filePath,
      accuracy: q.answer!.evaluation!.accuracy,
      depth: q.answer!.evaluation!.depth,
      awareness: q.answer!.evaluation!.awareness,
      feedback: q.answer!.evaluation!.feedback,
    }));
}

export function generateStudyGuide(sessionId: string): StudyGuideItem[] {
  const session = sessions.get(sessionId);
  if (!session) return [];

  const studyGuide: StudyGuideItem[] = [];

  for (const question of session.questions) {
    if (!question.answer?.evaluation) continue;

    const { evaluation } = question.answer;

    // Add items for low-scoring areas
    if (evaluation.accuracy < 0.6) {
      studyGuide.push({
        filePath: question.filePath,
        functionName: question.functionName || question.filePath,
        lineNumber: question.lineNumber,
        issue: "Low accuracy in understanding this code section",
        hint: `Review the implementation details of ${question.functionName || "this code"}. Focus on understanding the core logic and data flow.`,
      });
    }

    if (evaluation.depth < 0.6) {
      studyGuide.push({
        filePath: question.filePath,
        functionName: question.functionName || question.filePath,
        lineNumber: question.lineNumber,
        issue: "Lack of deep understanding of implementation details",
        hint: `Study the internal workings of ${question.functionName || "this code"}. Consider edge cases, error handling, and performance implications.`,
      });
    }

    if (evaluation.awareness < 0.6) {
      studyGuide.push({
        filePath: question.filePath,
        functionName: question.functionName || question.filePath,
        lineNumber: question.lineNumber,
        issue: "Limited awareness of broader context and architecture",
        hint: `Understand how ${question.functionName || "this code"} fits into the overall system architecture. Study its dependencies and dependents.`,
      });
    }
  }

  return studyGuide;
}

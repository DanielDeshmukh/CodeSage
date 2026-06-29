export {
  ExamSessionManager,
  getExamSessionManager,
} from "./session";
export type {
  ExamSession,
  ExamQuestion,
  ExamAnswer,
  ExamEvaluation,
  ExamMode,
  ExamStatus,
  Difficulty,
} from "./session";

export { QuestionGenerator, getQuestionGenerator } from "./question-generator";
export type { GeneratedQuestion, QuestionGenerationOptions } from "./question-generator";

export { AnswerEvaluator, getAnswerEvaluator } from "./answer-evaluator";
export type { EvaluationOptions } from "./answer-evaluator";

export { FeedbackGenerator, getFeedbackGenerator } from "./feedback-generator";
export type { FeedbackResult } from "./feedback-generator";

export { FollowUpGenerator, getFollowUpGenerator } from "./follow-up-generator";
export type { FollowUpResult } from "./follow-up-generator";

export { ExamLoop, getExamLoop } from "./exam-loop";
export type { ExamLoopOptions, ExamLoopResult } from "./exam-loop";

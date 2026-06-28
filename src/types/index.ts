// ============================================================================
// CodeSage Core Types
// ============================================================================

// ----------------------------------------------------------------------------
// Repository Types
// ----------------------------------------------------------------------------

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  stars: number;
  forks: number;
  createdAt: string;
  updatedAt: string;
  ingestedAt: string | null;
  status: RepositoryStatus;
  stats: RepositoryStats;
}

export type RepositoryStatus = "pending" | "cloning" | "parsing" | "indexing" | "ready" | "error";

export interface RepositoryStats {
  totalFiles: number;
  sourceFiles: number;
  totalLines: number;
  languages: LanguageStat[];
  chunks: number;
}

export interface LanguageStat {
  language: string;
  files: number;
  lines: number;
  percentage: number;
}

// ----------------------------------------------------------------------------
// AST Chunk Types
// ----------------------------------------------------------------------------

export type ChunkType = "function" | "class" | "module" | "config" | "documentation";

export interface CodeChunk {
  id: string;
  repositoryId: string;
  type: ChunkType;
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  docstring: string | null;
  language: string;
  calls: string[];
  calledBy: string[];
  complexity: number;
  hasTodos: boolean;
  dependencyCount: number;
  summary: string | null;
  embedding: number[] | null;
}

// ----------------------------------------------------------------------------
// Exam Types
// ----------------------------------------------------------------------------

export type ExamMode = "viva" | "interview" | "code-review";

export type ExamStatus = "pending" | "in-progress" | "completed" | "cancelled";

export interface ExamSession {
  id: string;
  repositoryId: string;
  mode: ExamMode;
  status: ExamStatus;
  startedAt: string;
  completedAt: string | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: ExamQuestion[];
  scores: ExamScores;
}

export interface ExamQuestion {
  id: string;
  sessionId: string;
  chunkId: string;
  question: string;
  filePath: string;
  functionName: string | null;
  lineNumber: number;
  askedAt: string;
  answer: ExamAnswer | null;
}

export interface ExamAnswer {
  id: string;
  questionId: string;
  content: string;
  answeredAt: string;
  evaluation: AnswerEvaluation | null;
}

export interface AnswerEvaluation {
  accuracy: number;
  depth: number;
  awareness: number;
  feedback: string;
  followUpQuestion: string | null;
}

// ----------------------------------------------------------------------------
// Score Types
// ----------------------------------------------------------------------------

export interface ExamScores {
  architecture: number;
  codeDetail: number;
  scalability: number;
  overall: number;
}

export interface ScoreReport {
  id: string;
  sessionId: string;
  repositoryId: string;
  scores: ExamScores;
  questionBreakdown: QuestionScore[];
  studyGuide: StudyGuideItem[];
  generatedAt: string;
}

export interface QuestionScore {
  questionId: string;
  question: string;
  filePath: string;
  accuracy: number;
  depth: number;
  awareness: number;
  feedback: string;
}

export interface StudyGuideItem {
  filePath: string;
  functionName: string;
  lineNumber: number;
  issue: string;
  hint: string;
}

// ----------------------------------------------------------------------------
// NIM Model Types
// ----------------------------------------------------------------------------

export interface NIMConfig {
  baseUrl: string;
  apiKey: string;
  models: NIMModels;
}

export interface NIMModels {
  embedding: string;
  reranker: string;
  examiner: string;
  scorer: string;
  safety: string;
}

export interface EmbeddingRequest {
  input: string | string[];
  model: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface RerankRequest {
  query: string;
  documents: string[];
  model: string;
  topN?: number;
}

export interface RerankResponse {
  results: RerankResult[];
  model: string;
}

export interface RerankResult {
  index: number;
  relevanceScore: number;
  document: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ----------------------------------------------------------------------------
// API Types
// ----------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ----------------------------------------------------------------------------
// UI Types
// ----------------------------------------------------------------------------

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

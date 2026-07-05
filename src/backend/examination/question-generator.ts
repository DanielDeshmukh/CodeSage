import { getNIMClient } from "@/ai/nim/client";
import { NIM_MODELS } from "@/ai/nim/config";
import { getRetrievalPipeline } from "@/backend/vector/retrieval";
import {
  getExaminerSystemPrompt,
  getQuestionGenerationPrompt,
  type PromptContext,
} from "@/ai/prompts/examiner";
import type { ExamMode, Difficulty, ExamQuestion } from "./session";

export interface QuestionGenerationOptions {
  repositoryId: string;
  mode: ExamMode;
  difficulty: Difficulty;
  query?: string;
  questionCount?: number;
  previousQuestions?: string[];
}

export interface GeneratedQuestion extends ExamQuestion {
  sourceChunk: {
    id: string;
    name: string;
    filePath: string;
    language: string;
  };
}

export class QuestionGenerator {
  private client = getNIMClient();
  private retrievalPipeline = getRetrievalPipeline();
  private config = NIM_MODELS.examiner;

  async generateQuestion(
    options: QuestionGenerationOptions
  ): Promise<GeneratedQuestion | null> {
    const {
      repositoryId,
      mode,
      difficulty,
      query = "complex logic error handling",
      questionCount = 1,
      previousQuestions = [],
    } = options;

    let context: PromptContext;
    let chunk = null;

    try {
      // Try to retrieve relevant code chunks
      const retrievalResult = await this.retrievalPipeline.retrieve({
        repositoryId,
        query,
        topK: 3,
        rerankTopN: 3,
      });

      if (retrievalResult.chunks.length > 0) {
        chunk = retrievalResult.chunks[0];
        context = {
          repositoryId,
          language: chunk.language,
          filePath: chunk.filePath || "unknown",
          chunkName: chunk.name,
          codeContent: chunk.content,
          summary: chunk.summary || undefined,
          previousQuestions,
        };
      } else {
        // Fallback: generate generic question without code context
        context = {
          repositoryId,
          language: "unknown",
          filePath: "unknown",
          chunkName: "general",
          codeContent: "",
          summary: undefined,
          previousQuestions,
        };
      }
    } catch (error) {
      // If retrieval fails (e.g., Qdrant not available), use generic context
      console.warn("Retrieval failed, using generic context:", error);
      context = {
        repositoryId,
        language: "unknown",
        filePath: "unknown",
        chunkName: "general",
        codeContent: "",
        summary: undefined,
        previousQuestions,
      };
    }

    const systemPrompt = getExaminerSystemPrompt(mode);
    const userPrompt = getQuestionGenerationPrompt(
      context,
      mode,
      difficulty,
      questionCount
    );

    const response = await this.client.chat({
      model: this.config.id,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      top_p: this.config.topP,
    });

    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        if (questions.length > 0) {
          const q = questions[0];
          return {
            id: q.id || `q-${Date.now()}`,
            question: q.question,
            type: q.type || "conceptual",
            difficulty: q.difficulty || difficulty,
            context: {
              filePath: chunk?.filePath || "unknown",
              language: chunk?.language || "unknown",
              chunkName: chunk?.name || "general",
            },
            expectedPoints: q.expectedPoints || [],
            followUp: q.followUp,
            sourceChunk: chunk ? {
              id: chunk.id,
              name: chunk.name,
              filePath: chunk.filePath || "unknown",
              language: chunk.language,
            } : {
              id: "generic",
              name: "general",
              filePath: "unknown",
              language: "unknown",
            },
          };
        }
      }
    } catch (error) {
      console.error("Failed to parse question:", error);
    }

    return null;
  }

  async generateQuestionSet(
    options: QuestionGenerationOptions,
    count: number = 5
  ): Promise<GeneratedQuestion[]> {
    const questions: GeneratedQuestion[] = [];
    const previousQuestions: string[] = [];

    for (let i = 0; i < count; i++) {
      const query = this.getQueryForIndex(i, options.mode);
      const question = await this.generateQuestion({
        ...options,
        query,
        previousQuestions,
      });

      if (question) {
        questions.push(question);
        previousQuestions.push(question.question);
      }
    }

    return questions;
  }

  private getQueryForIndex(index: number, mode: ExamMode): string {
    const queries: Record<ExamMode, string[]> = {
      viva: [
        "design patterns architecture",
        "error handling validation",
        "performance optimization",
        "security vulnerabilities",
        "testing strategy",
        "code organization",
        "dependency management",
        "documentation quality",
      ],
      interview: [
        "algorithm implementation",
        "data structures usage",
        "edge cases handling",
        "complexity analysis",
        "code optimization",
        "bug identification",
        "feature implementation",
        "refactoring opportunities",
      ],
      "code-review": [
        "code quality readability",
        "design patterns usage",
        "potential bugs issues",
        "performance bottlenecks",
        "security concerns",
        "testing coverage",
        "documentation completeness",
        "maintainability",
      ],
    };

    const modeQueries = queries[mode];
    return modeQueries[index % modeQueries.length];
  }
}

let instance: QuestionGenerator | null = null;

export function getQuestionGenerator(): QuestionGenerator {
  if (!instance) {
    instance = new QuestionGenerator();
  }
  return instance;
}

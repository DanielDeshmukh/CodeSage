import { getNIMGateway } from "@/ai/nim/gateway";
import type { CodeChunk, ExamMode } from "@/types";

// ============================================================================
// Question Generator
// ============================================================================

export interface GeneratedQuestion {
  question: string;
  chunkId: string;
  filePath: string;
  functionName: string | null;
  lineNumber: number;
}

// Exam mode prompts
const MODE_PROMPTS: Record<ExamMode, string> = {
  viva: `You are an expert code reviewer conducting a viva voce examination.
Your goal is to test the candidate's deep understanding of the codebase.
Ask questions that probe:
1. Architecture decisions and trade-offs
2. Implementation details and algorithms
3. Edge cases and error handling
4. Performance considerations
5. Code quality and maintainability

Generate questions that require detailed, technical answers.
Focus on understanding WHY decisions were made, not just WHAT was implemented.`,

  interview: `You are a technical interviewer assessing a candidate's codebase knowledge.
Your goal is to evaluate their readiness for technical interviews.
Ask questions that demonstrate:
1. System design thinking
2. Problem-solving approach
3. Code comprehension depth
4. Ability to explain complex concepts
5. Awareness of best practices

Generate questions that would appear in a real technical interview.
Focus on both high-level architecture and implementation specifics.`,

  "code-review": `You are conducting a thorough code review session.
Your goal is to identify issues and improvement opportunities.
Focus on:
1. Potential bugs and edge cases
2. Performance bottlenecks
3. Security vulnerabilities
4. Code maintainability
5. Design pattern usage

Generate questions that help improve code quality.
Focus on specific code sections that could benefit from review.`,
};

// Question templates for different chunk types
const QUESTION_TEMPLATES: Record<string, string[]> = {
  function: [
    "Can you explain the purpose and implementation of this function?",
    "What are the edge cases this function should handle?",
    "How does this function handle errors?",
    "What is the time complexity of this function?",
    "How would you improve this function's performance?",
    "What inputs would cause this function to fail?",
    "How does this function interact with other parts of the system?",
  ],
  class: [
    "What is the responsibility of this class?",
    "How does this class implement encapsulation?",
    "What design patterns are used in this class?",
    "How would you extend this class's functionality?",
    "What are the dependencies of this class?",
    "How does this class handle state management?",
    "What would happen if this class was modified?",
  ],
  module: [
    "What is the overall architecture of this module?",
    "How do the components in this module interact?",
    "What are the entry points of this module?",
    "How would you test this module?",
    "What are the potential bottlenecks in this module?",
    "How does this module handle configuration?",
    "What external dependencies does this module have?",
  ],
};

export class QuestionGenerator {
  private nim = getNIMGateway();

  // --------------------------------------------------------------------------
  // Generate Questions for a Repository
  // --------------------------------------------------------------------------

  async generateQuestions(
    chunks: CodeChunk[],
    mode: ExamMode,
    count: number = 10
  ): Promise<GeneratedQuestion[]> {
    // Select relevant chunks (prioritize functions and classes)
    const relevantChunks = this.selectRelevantChunks(chunks, count * 2);

    const questions: GeneratedQuestion[] = [];

    for (const chunk of relevantChunks.slice(0, count)) {
      try {
        const question = await this.generateQuestionForChunk(chunk, mode);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.error(
          `Failed to generate question for chunk ${chunk.id}:`,
          error
        );
      }
    }

    return questions;
  }

  // --------------------------------------------------------------------------
  // Generate Question for a Specific Chunk
  // --------------------------------------------------------------------------

  async generateQuestionForChunk(
    chunk: CodeChunk,
    mode: ExamMode
  ): Promise<GeneratedQuestion | null> {
    const templates = QUESTION_TEMPLATES[chunk.type] || QUESTION_TEMPLATES.function;
    const template = templates[Math.floor(Math.random() * templates.length)];

    const systemPrompt = MODE_PROMPTS[mode];
    const userPrompt = `
Analyze the following code and generate a question based on this template:
"${template}"

Code Context:
- Type: ${chunk.type}
- Name: ${chunk.name}
- File: ${chunk.filePath}
- Language: ${chunk.language}
- Complexity: ${chunk.complexity}

Code Content:
\`\`\`${chunk.language}
${chunk.content.slice(0, 2000)}
\`\`\`

${chunk.docstring ? `Documentation:\n${chunk.docstring}` : ""}

Generate a single, specific question that tests deep understanding of this code.
The question should be clear, concise, and require technical knowledge to answer.
Do not include the answer - just generate the question.`;

    try {
      const response = await this.nim.examine(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.7,
          maxTokens: 256,
        }
      );

      const questionText = response.content.trim();

      // Validate the question
      if (questionText.length < 10 || questionText.length > 500) {
        return null;
      }

      return {
        question: questionText,
        chunkId: chunk.id,
        filePath: chunk.filePath,
        functionName: chunk.type === "function" ? chunk.name : null,
        lineNumber: chunk.startLine,
      };
    } catch (error) {
      console.error("Question generation failed:", error);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Select Relevant Chunks
  // --------------------------------------------------------------------------

  private selectRelevantChunks(
    chunks: CodeChunk[],
    count: number
  ): CodeChunk[] {
    // Score chunks by relevance
    const scored = chunks.map((chunk) => ({
      chunk,
      score: this.calculateRelevanceScore(chunk),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return top chunks
    return scored.slice(0, count).map((s) => s.chunk);
  }

  private calculateRelevanceScore(chunk: CodeChunk): number {
    let score = 0;

    // Prioritize functions and classes
    if (chunk.type === "function") score += 3;
    if (chunk.type === "class") score += 4;
    if (chunk.type === "module") score += 2;

    // Prioritize by complexity (more complex = more interesting)
    score += Math.min(chunk.complexity, 5);

    // Prioritize by content length (longer = more to discuss)
    if (chunk.content.length > 500) score += 2;
    if (chunk.content.length > 1000) score += 1;

    // Deprioritize if has too many todos (incomplete code)
    if (chunk.hasTodos) score -= 1;

    return score;
  }
}

// Singleton instance
let generatorInstance: QuestionGenerator | null = null;

export function getQuestionGenerator(): QuestionGenerator {
  if (!generatorInstance) {
    generatorInstance = new QuestionGenerator();
  }
  return generatorInstance;
}

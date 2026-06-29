import { getNIMClient, type NIMChatResponse } from "./client";
import { NIM_MODELS } from "./config";

export interface ExaminerContext {
  repositoryName: string;
  language: string;
  filePath: string;
  codeContent: string;
  chunkSummary?: string;
}

export interface QuestionRequest {
  context: ExaminerContext;
  mode: "viva" | "interview" | "code-review";
  difficulty: "beginner" | "intermediate" | "advanced";
  previousQuestions?: string[];
  questionCount?: number;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  type: "conceptual" | "implementation" | "architecture" | "best-practice";
  difficulty: "beginner" | "intermediate" | "advanced";
  expectedPoints: string[];
  followUp?: string;
}

export class ExaminerService {
  private client = getNIMClient();
  private config = NIM_MODELS.examiner;

  async generateQuestions(request: QuestionRequest): Promise<GeneratedQuestion[]> {
    const prompt = this.buildQuestionPrompt(request);
    const response = await this.client.chat({
      model: this.config.id,
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer and code reviewer. Generate thoughtful, relevant questions based on the provided code context. Questions should be specific to the actual code shown, not generic. Return questions as a JSON array.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      top_p: this.config.topP,
    });

    return this.parseQuestions(response);
  }

  async generateFollowUp(
    previousQuestion: string,
    userAnswer: string,
    context: ExaminerContext
  ): Promise<string> {
    const response = await this.client.chat({
      model: this.config.id,
      messages: [
        {
          role: "system",
          content: `You are an expert interviewer. Generate a concise follow-up question based on the candidate's answer. Be specific and probing.`,
        },
        {
          role: "user",
          content: `Code Context: ${context.filePath} (${context.language})\n\nPrevious Question: ${previousQuestion}\n\nCandidate's Answer: ${userAnswer}\n\nGenerate a follow-up question:`,
        },
      ],
      temperature: 0.7,
      max_tokens: 256,
    });

    return response.choices[0].message.content;
  }

  async evaluateAnswer(
    question: string,
    answer: string,
    context: ExaminerContext
  ): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }> {
    const response = await this.client.chat({
      model: this.config.id,
      messages: [
        {
          role: "system",
          content: `You are an expert code reviewer evaluating a candidate's answer. Provide constructive feedback with specific strengths and areas for improvement. Return JSON with score (0-100), feedback, strengths array, and improvements array.`,
        },
        {
          role: "user",
          content: `Code Context: ${context.filePath}\n\nQuestion: ${question}\n\nAnswer: ${answer}\n\nEvaluate the answer:`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    try {
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      return {
        score: parsed.score ?? 0,
        feedback: parsed.feedback ?? "",
        strengths: parsed.strengths ?? [],
        improvements: parsed.improvements ?? [],
      };
    } catch {
      return {
        score: 50,
        feedback: "Unable to parse evaluation",
        strengths: [],
        improvements: [],
      };
    }
  }

  private buildQuestionPrompt(request: QuestionRequest): string {
    const { context, mode, difficulty, questionCount = 5 } = request;

    let modeInstruction = "";
    switch (mode) {
      case "viva":
        modeInstruction = "Focus on conceptual understanding and defense of design decisions.";
        break;
      case "interview":
        modeInstruction = "Focus on problem-solving and implementation details.";
        break;
      case "code-review":
        modeInstruction = "Focus on code quality, best practices, and potential improvements.";
        break;
    }

    return `Generate ${questionCount} ${difficulty} level questions for a ${mode} examination.

Code Context:
- Repository: ${context.repositoryName}
- File: ${context.filePath}
- Language: ${context.language}
${context.chunkSummary ? `- Summary: ${context.chunkSummary}` : ""}

Code:
\`\`\`${context.language}
${context.codeContent.slice(0, 3000)}
\`\`\`

Instructions:
- ${modeInstruction}
- Questions must be specific to this actual code
- Include a mix of question types (conceptual, implementation, architecture, best-practice)
- Each question should have expected key points for evaluation
- Return as JSON array with fields: id, question, type, difficulty, expectedPoints, followUp (optional)`;
  }

  private parseQuestions(response: NIMChatResponse): GeneratedQuestion[] {
    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fall back to empty array
    }
    return [];
  }
}

let instance: ExaminerService | null = null;

export function getExaminerService(): ExaminerService {
  if (!instance) {
    instance = new ExaminerService();
  }
  return instance;
}

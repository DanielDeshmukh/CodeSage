import { getNIMClient } from "@/ai/nim/client";
import { NIM_MODELS } from "@/ai/nim/config";
import { getAnswerEvaluationPrompt, type PromptContext } from "@/ai/prompts/examiner";
import type { ExamQuestion, ExamEvaluation } from "./session";

export interface EvaluationOptions {
  question: ExamQuestion;
  answer: string;
  context: PromptContext;
}

export class AnswerEvaluator {
  private client = getNIMClient();
  private config = NIM_MODELS.scorer;

  async evaluate(options: EvaluationOptions): Promise<ExamEvaluation> {
    const { question, answer, context } = options;

    const prompt = getAnswerEvaluationPrompt(
      question.question,
      answer,
      question.expectedPoints,
      context
    );

    const response = await this.client.chat({
      model: this.config.id,
      messages: [
        {
          role: "system",
          content: `You are an objective technical evaluator. Score answers based on accuracy, completeness, clarity, and depth. Be strict but fair. Return JSON with detailed scoring breakdown.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      top_p: this.config.topP,
    });

    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questionId: question.id,
          score: Math.min(100, Math.max(0, parsed.score || 0)),
          maxScore: 100,
          breakdown: {
            accuracy: Math.min(100, Math.max(0, parsed.breakdown?.accuracy || 0)),
            completeness: Math.min(100, Math.max(0, parsed.breakdown?.completeness || 0)),
            clarity: Math.min(100, Math.max(0, parsed.breakdown?.clarity || 0)),
            depth: Math.min(100, Math.max(0, parsed.breakdown?.depth || 0)),
          },
          feedback: parsed.feedback || "No feedback available",
          matchedPoints: parsed.matchedPoints || [],
          missedPoints: parsed.missedPoints || [],
        };
      }
    } catch (error) {
      console.error("Failed to parse evaluation:", error);
    }

    return {
      questionId: question.id,
      score: 0,
      maxScore: 100,
      breakdown: {
        accuracy: 0,
        completeness: 0,
        clarity: 0,
        depth: 0,
      },
      feedback: "Failed to evaluate answer",
      matchedPoints: [],
      missedPoints: question.expectedPoints,
    };
  }

  async evaluateBatch(
    evaluations: EvaluationOptions[]
  ): Promise<ExamEvaluation[]> {
    const results = await Promise.all(
      evaluations.map((options) => this.evaluate(options))
    );
    return results;
  }

  calculateOverallScore(evaluations: ExamEvaluation[]): {
    overall: number;
    dimensions: {
      accuracy: number;
      completeness: number;
      clarity: number;
      depth: number;
    };
  } {
    if (evaluations.length === 0) {
      return {
        overall: 0,
        dimensions: {
          accuracy: 0,
          completeness: 0,
          clarity: 0,
          depth: 0,
        },
      };
    }

    const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0);
    const overall = Math.round(totalScore / evaluations.length);

    const dimensions = {
      accuracy: Math.round(
        evaluations.reduce((sum, e) => sum + e.breakdown.accuracy, 0) / evaluations.length
      ),
      completeness: Math.round(
        evaluations.reduce((sum, e) => sum + e.breakdown.completeness, 0) / evaluations.length
      ),
      clarity: Math.round(
        evaluations.reduce((sum, e) => sum + e.breakdown.clarity, 0) / evaluations.length
      ),
      depth: Math.round(
        evaluations.reduce((sum, e) => sum + e.breakdown.depth, 0) / evaluations.length
      ),
    };

    return { overall, dimensions };
  }
}

let instance: AnswerEvaluator | null = null;

export function getAnswerEvaluator(): AnswerEvaluator {
  if (!instance) {
    instance = new AnswerEvaluator();
  }
  return instance;
}

import { getNIMClient } from "@/ai/nim/client";
import { NIM_MODELS } from "@/ai/nim/config";
import { getFeedbackGenerationPrompt } from "@/ai/prompts/examiner";
import type { ExamMode, ExamEvaluation } from "./session";

export interface FeedbackResult {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  encouragement: string;
}

export class FeedbackGenerator {
  private client = getNIMClient();
  private config = NIM_MODELS.examiner;

  async generateFeedback(
    mode: ExamMode,
    evaluations: ExamEvaluation[],
    overallScore: number
  ): Promise<FeedbackResult> {
    const evaluationData = evaluations.map((e) => ({
      question: `Question ${e.questionId}`,
      score: e.score,
      feedback: e.feedback,
    }));

    const prompt = getFeedbackGenerationPrompt(
      evaluationData,
      overallScore,
      mode
    );

    const response = await this.client.chat({
      model: this.config.id,
      messages: [
        {
          role: "system",
          content: `You are an expert technical educator providing constructive feedback. Be encouraging while being honest about areas for improvement. Focus on actionable advice.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || "No summary available",
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
          recommendations: parsed.recommendations || [],
          encouragement: parsed.encouragement || "Keep up the good work!",
        };
      }
    } catch (error) {
      console.error("Failed to parse feedback:", error);
    }

    return this.getDefaultFeedback(overallScore);
  }

  async generateQuestionFeedback(
    evaluation: ExamEvaluation
  ): Promise<string> {
    const response = await this.client.chat({
      model: this.config.id,
      messages: [
        {
          role: "system",
          content: `You are a helpful technical mentor. Provide brief, constructive feedback on the candidate's answer. Be encouraging and specific.`,
        },
        {
          role: "user",
          content: `Score: ${evaluation.score}/100\n\nFeedback: ${evaluation.feedback}\n\nMatched points: ${evaluation.matchedPoints.join(", ")}\n\nMissed points: ${evaluation.missedPoints.join(", ")}\n\nProvide brief, encouraging feedback:`,
        },
      ],
      temperature: 0.7,
      max_tokens: 256,
    });

    return response.choices[0].message.content;
  }

  private getDefaultFeedback(score: number): FeedbackResult {
    if (score >= 80) {
      return {
        summary: "Excellent performance! You demonstrated strong understanding of the codebase.",
        strengths: ["Deep technical knowledge", "Clear communication", "Comprehensive answers"],
        improvements: ["Continue exploring advanced topics"],
        recommendations: ["Practice more complex scenarios", "Review edge cases"],
        encouragement: "Outstanding work! You're well-prepared for technical discussions.",
      };
    } else if (score >= 60) {
      return {
        summary: "Good performance with room for improvement.",
        strengths: ["Solid understanding of fundamentals", "Good problem-solving approach"],
        improvements: ["Deepen understanding of complex topics", "Improve explanation clarity"],
        recommendations: ["Review missed concepts", "Practice explaining code decisions"],
        encouragement: "Good progress! Focus on the areas mentioned to reach excellence.",
      };
    } else {
      return {
        summary: "You're on the right track but need more preparation.",
        strengths: ["Willingness to learn", "Basic understanding present"],
        improvements: ["Strengthen core concepts", "Practice code analysis"],
        recommendations: ["Study the codebase more thoroughly", "Review fundamental concepts"],
        encouragement: "Keep practicing! Every expert started somewhere. Focus on the fundamentals.",
      };
    }
  }
}

let instance: FeedbackGenerator | null = null;

export function getFeedbackGenerator(): FeedbackGenerator {
  if (!instance) {
    instance = new FeedbackGenerator();
  }
  return instance;
}

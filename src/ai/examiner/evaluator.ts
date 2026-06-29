import { getNIMGateway } from "@/ai/nim/gateway";
import type { AnswerEvaluation, ExamMode } from "@/types";

// ============================================================================
// Answer Evaluator
// ============================================================================

export interface EvaluationResult {
  evaluation: AnswerEvaluation;
  followUpQuestion: string | null;
}

// Evaluation criteria prompts
const EVALUATION_CRITERIA: Record<ExamMode, string> = {
  viva: `Evaluate the candidate's answer based on:
1. Accuracy: Is the answer technically correct?
2. Depth: Does it demonstrate deep understanding?
3. Awareness: Does it show awareness of broader context?

Provide scores from 0.0 to 1.0 for each criterion.
Generate follow-up questions to probe deeper if needed.`,

  interview: `Evaluate the candidate's answer for interview readiness:
1. Accuracy: Technical correctness and completeness
2. Depth: Understanding of implementation details
3. Awareness: System design thinking and best practices

Provide scores from 0.0 to 1.0 for each criterion.
Focus on whether this answer would impress in a technical interview.`,

  "code-review": `Evaluate the answer for code review quality:
1. Accuracy: Correctness of code analysis
2. Depth: Understanding of code implications
3. Awareness: Knowledge of potential issues and improvements

Provide scores from 0.0 to 1.0 for each criterion.
Focus on actionable insights and improvement suggestions.`,
};

export class AnswerEvaluator {
  private nim = getNIMGateway();

  // --------------------------------------------------------------------------
  // Evaluate Answer
  // --------------------------------------------------------------------------

  async evaluate(
    question: string,
    answer: string,
    codeContext: string,
    mode: ExamMode
  ): Promise<EvaluationResult> {
    const systemPrompt = `
You are an expert code evaluator with deep technical knowledge.

${EVALUATION_CRITERIA[mode]}

You MUST respond in the following JSON format only:
{
  "accuracy": <number between 0.0 and 1.0>,
  "depth": <number between 0.0 and 1.0>,
  "awareness": <number between 0.0 and 1.0>,
  "feedback": "<detailed feedback string>",
  "followUpQuestion": "<optional follow-up question string or null>"
}

Do not include any text outside the JSON response.
`;

    const userPrompt = `
Question:
${question}

Candidate's Answer:
${answer}

Code Context:
\`\`\`
${codeContext.slice(0, 3000)}
\`\`\`

Evaluate this answer and provide your assessment in the required JSON format.
`;

    try {
      const response = await this.nim.examine(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.3,
          maxTokens: 1024,
        }
      );

      const result = this.parseEvaluationResponse(response.content);

      return {
        evaluation: {
          accuracy: result.accuracy,
          depth: result.depth,
          awareness: result.awareness,
          feedback: result.feedback,
          followUpQuestion: result.followUpQuestion,
        },
        followUpQuestion: result.followUpQuestion,
      };
    } catch (error) {
      console.error("Answer evaluation failed:", error);

      // Return default evaluation on failure
      return {
        evaluation: {
          accuracy: 0.5,
          depth: 0.5,
          awareness: 0.5,
          feedback: "Unable to evaluate the answer. Please try again.",
          followUpQuestion: null,
        },
        followUpQuestion: null,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Parse Evaluation Response
  // --------------------------------------------------------------------------

  private parseEvaluationResponse(response: string): {
    accuracy: number;
    depth: number;
    awareness: number;
    feedback: string;
    followUpQuestion: string | null;
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        accuracy: this.clampScore(parsed.accuracy),
        depth: this.clampScore(parsed.depth),
        awareness: this.clampScore(parsed.awareness),
        feedback: typeof parsed.feedback === "string" ? parsed.feedback : "No feedback provided.",
        followUpQuestion:
          typeof parsed.followUpQuestion === "string"
            ? parsed.followUpQuestion
            : null,
      };
    } catch (error) {
      console.error("Failed to parse evaluation response:", error);

      // Try to extract scores from text
      const accuracyMatch = response.match(/accuracy[:\s]*(\d+\.?\d*)/i);
      const depthMatch = response.match(/depth[:\s]*(\d+\.?\d*)/i);
      const awarenessMatch = response.match(/awareness[:\s]*(\d+\.?\d*)/i);

      return {
        accuracy: accuracyMatch
          ? this.clampScore(parseFloat(accuracyMatch[1]))
          : 0.5,
        depth: depthMatch ? this.clampScore(parseFloat(depthMatch[1])) : 0.5,
        awareness: awarenessMatch
          ? this.clampScore(parseFloat(awarenessMatch[1]))
          : 0.5,
        feedback: response.slice(0, 500),
        followUpQuestion: null,
      };
    }
  }

  private clampScore(score: number): number {
    if (isNaN(score)) return 0.5;
    return Math.max(0, Math.min(1, score));
  }
}

// Singleton instance
let evaluatorInstance: AnswerEvaluator | null = null;

export function getAnswerEvaluator(): AnswerEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = new AnswerEvaluator();
  }
  return evaluatorInstance;
}

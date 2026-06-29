import { getNIMClient, type NIMChatResponse } from "./client";
import { NIM_MODELS } from "./config";

export interface ScoringRequest {
  question: string;
  answer: string;
  expectedPoints: string[];
  context?: {
    filePath: string;
    language: string;
  };
}

export interface ScoringResult {
  score: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    accuracy: number;
    completeness: number;
    clarity: number;
    depth: number;
  };
  feedback: string;
  matchedPoints: string[];
  missedPoints: string[];
}

export class ScorerService {
  private client = getNIMClient();
  private config = NIM_MODELS.scorer;

  async score(request: ScoringRequest): Promise<ScoringResult> {
    const prompt = this.buildScoringPrompt(request);
    const response = await this.client.chat({
      model: this.config.id,
      messages: [
        {
          role: "system",
          content: `You are an objective technical evaluator. Score answers based on accuracy, completeness, clarity, and depth. Be strict but fair. Return JSON with detailed scoring breakdown.`,
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

    return this.parseScoringResult(response);
  }

  async scoreBatch(
    requests: ScoringRequest[]
  ): Promise<ScoringResult[]> {
    const results = await Promise.all(
      requests.map((request) => this.score(request))
    );
    return results;
  }

  async computeOverallScore(
    results: ScoringResult[]
  ): Promise<{
    overallScore: number;
    averagePercentage: number;
    dimensionAverages: {
      accuracy: number;
      completeness: number;
      clarity: number;
      depth: number;
    };
  }> {
    if (results.length === 0) {
      return {
        overallScore: 0,
        averagePercentage: 0,
        dimensionAverages: {
          accuracy: 0,
          completeness: 0,
          clarity: 0,
          depth: 0,
        },
      };
    }

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalMax = results.reduce((sum, r) => sum + r.maxScore, 0);
    const avgPercentage =
      results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

    const dimensionAverages = {
      accuracy:
        results.reduce((sum, r) => sum + r.breakdown.accuracy, 0) /
        results.length,
      completeness:
        results.reduce((sum, r) => sum + r.breakdown.completeness, 0) /
        results.length,
      clarity:
        results.reduce((sum, r) => sum + r.breakdown.clarity, 0) /
        results.length,
      depth:
        results.reduce((sum, r) => sum + r.breakdown.depth, 0) / results.length,
    };

    return {
      overallScore: Math.round((totalScore / totalMax) * 100),
      averagePercentage: Math.round(avgPercentage),
      dimensionAverages: {
        accuracy: Math.round(dimensionAverages.accuracy),
        completeness: Math.round(dimensionAverages.completeness),
        clarity: Math.round(dimensionAverages.clarity),
        depth: Math.round(dimensionAverages.depth),
      },
    };
  }

  private buildScoringPrompt(request: ScoringRequest): string {
    const { question, answer, expectedPoints, context } = request;

    return `Score the following answer to a technical question.

${context ? `Context: ${context.filePath} (${context.language})` : ""}

Question: ${question}

Answer: ${answer}

Expected Key Points:
${expectedPoints.map((point, i) => `${i + 1}. ${point}`).join("\n")}

Provide a JSON response with:
{
  "score": <0-100>,
  "maxScore": 100,
  "breakdown": {
    "accuracy": <0-100>,
    "completeness": <0-100>,
    "clarity": <0-100>,
    "depth": <0-100>
  },
  "feedback": "<detailed feedback>",
  "matchedPoints": ["<points the answer covered>"],
  "missedPoints": ["<points the answer missed>"]
}`;
  }

  private parseScoringResult(response: NIMChatResponse): ScoringResult {
    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.min(100, Math.max(0, parsed.score ?? 0)),
          maxScore: 100,
          percentage: parsed.score ?? 0,
          breakdown: {
            accuracy: Math.min(100, Math.max(0, parsed.breakdown?.accuracy ?? 0)),
            completeness: Math.min(100, Math.max(0, parsed.breakdown?.completeness ?? 0)),
            clarity: Math.min(100, Math.max(0, parsed.breakdown?.clarity ?? 0)),
            depth: Math.min(100, Math.max(0, parsed.breakdown?.depth ?? 0)),
          },
          feedback: parsed.feedback ?? "",
          matchedPoints: parsed.matchedPoints ?? [],
          missedPoints: parsed.missedPoints ?? [],
        };
      }
    } catch {
      // Fall back to default result
    }

    return {
      score: 0,
      maxScore: 100,
      percentage: 0,
      breakdown: {
        accuracy: 0,
        completeness: 0,
        clarity: 0,
        depth: 0,
      },
      feedback: "Unable to parse scoring result",
      matchedPoints: [],
      missedPoints: [],
    };
  }
}

let instance: ScorerService | null = null;

export function getScorerService(): ScorerService {
  if (!instance) {
    instance = new ScorerService();
  }
  return instance;
}

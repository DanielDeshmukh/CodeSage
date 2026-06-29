import { getNIMClient } from "@/ai/nim/client";
import { NIM_MODELS } from "@/ai/nim/config";
import type { ExamSession, ExamEvaluation } from "@/backend/examination/session";

export interface StudyGuide {
  sessionId: string;
  strugglingAreas: StrugglingArea[];
  recommendations: Recommendation[];
  hints: Hint[];
  fileReferences: FileReference[];
  generatedAt: string;
}

export interface StrugglingArea {
  topic: string;
  description: string;
  severity: "low" | "medium" | "high";
  relatedQuestions: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  resources: string[];
}

export interface Hint {
  questionId: string;
  hint: string;
  concept: string;
}

export interface FileReference {
  filePath: string;
  relevantConcepts: string[];
  suggestedStudy: string;
}

export class StudyGuideGenerator {
  private client = getNIMClient();
  private config = NIM_MODELS.examiner;

  async generate(session: ExamSession): Promise<StudyGuide> {
    const strugglingAreas = this.identifyStrugglingAreas(session);
    const recommendations = await this.generateRecommendations(session, strugglingAreas);
    const hints = await this.generateHints(session);
    const fileReferences = this.generateFileReferences(session);

    return {
      sessionId: session.id,
      strugglingAreas,
      recommendations,
      hints,
      fileReferences,
      generatedAt: new Date().toISOString(),
    };
  }

  private identifyStrugglingAreas(session: ExamSession): StrugglingArea[] {
    const areas: StrugglingArea[] = [];

    // Analyze dimension scores
    const dimensions = {
      accuracy: session.evaluations.reduce((sum, e) => sum + e.breakdown.accuracy, 0) / session.evaluations.length,
      completeness: session.evaluations.reduce((sum, e) => sum + e.breakdown.completeness, 0) / session.evaluations.length,
      clarity: session.evaluations.reduce((sum, e) => sum + e.breakdown.clarity, 0) / session.evaluations.length,
      depth: session.evaluations.reduce((sum, e) => sum + e.breakdown.depth, 0) / session.evaluations.length,
    };

    if (dimensions.accuracy < 60) {
      areas.push({
        topic: "Technical Accuracy",
        description: "Your answers contained inaccuracies in technical details. Focus on understanding core concepts more precisely.",
        severity: "high",
        relatedQuestions: session.evaluations
          .filter((e) => e.breakdown.accuracy < 60)
          .map((e) => e.questionId),
      });
    }

    if (dimensions.completeness < 60) {
      areas.push({
        topic: "Answer Completeness",
        description: "Your answers were often incomplete. Practice providing comprehensive responses that cover all aspects of the question.",
        severity: "medium",
        relatedQuestions: session.evaluations
          .filter((e) => e.breakdown.completeness < 60)
          .map((e) => e.questionId),
      });
    }

    if (dimensions.clarity < 60) {
      areas.push({
        topic: "Communication Clarity",
        description: "Your explanations could be clearer. Work on structuring your answers logically and using precise terminology.",
        severity: "medium",
        relatedQuestions: session.evaluations
          .filter((e) => e.breakdown.clarity < 60)
          .map((e) => e.questionId),
      });
    }

    if (dimensions.depth < 60) {
      areas.push({
        topic: "Technical Depth",
        description: "Your answers lacked depth. Practice explaining the 'why' behind your technical decisions.",
        severity: "high",
        relatedQuestions: session.evaluations
          .filter((e) => e.breakdown.depth < 60)
          .map((e) => e.questionId),
      });
    }

    // Analyze missed points
    const missedPoints = session.evaluations.flatMap((e) => e.missedPoints);
    const pointFrequency = missedPoints.reduce(
      (acc, point) => {
        acc[point] = (acc[point] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topMissed = Object.entries(pointFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([point]) => point);

    if (topMissed.length > 0) {
      areas.push({
        topic: "Key Concepts",
        description: `You missed several important concepts: ${topMissed.join(", ")}. Review these topics thoroughly.`,
        severity: "high",
        relatedQuestions: [],
      });
    }

    return areas;
  }

  private async generateRecommendations(
    session: ExamSession,
    strugglingAreas: StrugglingArea[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const area of strugglingAreas) {
      const response = await this.client.chat({
        model: this.config.id,
        messages: [
          {
            role: "system",
            content: "You are an expert technical educator. Provide specific, actionable study recommendations.",
          },
          {
            role: "user",
            content: `A candidate struggled with: ${area.topic}\n\nDescription: ${area.description}\n\nProvide 2-3 specific recommendations for improvement as JSON:\n[{"title": "Recommendation title", "description": "Detailed description", "priority": "high|medium|low", "resources": ["resource 1", "resource 2"]}]`,
          },
        ],
        temperature: 0.7,
        max_tokens: 512,
      });

      try {
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          recommendations.push(...parsed);
        }
      } catch {
        // Add default recommendation
        recommendations.push({
          title: `Study ${area.topic}`,
          description: area.description,
          priority: area.severity === "high" ? "high" : "medium",
          resources: ["Review documentation", "Practice with examples"],
        });
      }
    }

    return recommendations;
  }

  private async generateHints(session: ExamSession): Promise<Hint[]> {
    const hints: Hint[] = [];

    for (const evaluation of session.evaluations) {
      if (evaluation.score < 70) {
        const response = await this.client.chat({
          model: this.config.id,
          messages: [
            {
              role: "system",
              content: "You are a helpful technical mentor. Provide concise, actionable hints.",
            },
            {
              role: "user",
              content: `The candidate scored ${evaluation.score}/100 on a question.\n\nMissed points: ${evaluation.missedPoints.join(", ")}\n\nProvide a brief hint to help them understand the concept better:`,
            },
          ],
          temperature: 0.7,
          max_tokens: 256,
        });

        hints.push({
          questionId: evaluation.questionId,
          hint: response.choices[0].message.content,
          concept: evaluation.missedPoints[0] || "General concept",
        });
      }
    }

    return hints;
  }

  private generateFileReferences(session: ExamSession): FileReference[] {
    const fileMap = new Map<string, string[]>();

    for (const question of session.questions) {
      const filePath = question.context.filePath;
      if (!fileMap.has(filePath)) {
        fileMap.set(filePath, []);
      }
      fileMap.get(filePath)!.push(question.context.chunkName);
    }

    return Array.from(fileMap.entries()).map(([filePath, concepts]) => ({
      filePath,
      relevantConcepts: [...new Set(concepts)],
      suggestedStudy: `Review the implementation in ${filePath} and understand how ${concepts.slice(0, 3).join(", ")} work together.`,
    }));
  }
}

let instance: StudyGuideGenerator | null = null;

export function getStudyGuideGenerator(): StudyGuideGenerator {
  if (!instance) {
    instance = new StudyGuideGenerator();
  }
  return instance;
}

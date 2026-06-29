import type { ExamSession } from "@/backend/examination/session";
import { getScoreAggregator, type AggregatedScores } from "./score-aggregator";

export interface ScoreReport {
  sessionId: string;
  repositoryId: string;
  mode: string;
  difficulty: string;
  scores: AggregatedScores;
  dimensionLabels: {
    accuracy: string;
    completeness: string;
    clarity: string;
    depth: string;
  };
  radarData: Array<{
    dimension: string;
    score: number;
    fullMark: number;
  }>;
  questionBreakdown: Array<{
    questionId: string;
    questionNumber: number;
    score: number;
    maxScore: number;
    percentage: number;
    feedback: string;
  }>;
  performanceSummary: {
    grade: string;
    percentile: string;
    strengths: string[];
    weaknesses: string[];
  };
  metadata: {
    generatedAt: string;
    totalTimeMs: number;
    questionsAnswered: number;
  };
}

export class ScoreReportGenerator {
  private aggregator = getScoreAggregator();

  generate(session: ExamSession): ScoreReport {
    const scores = this.aggregator.aggregate(session);
    const radarData = this.generateRadarData(scores);
    const dimensionLabels = this.generateDimensionLabels(scores.dimensions);
    const questionBreakdown = this.generateQuestionBreakdown(session);
    const performanceSummary = this.generatePerformanceSummary(scores);

    return {
      sessionId: session.id,
      repositoryId: session.repositoryId,
      mode: session.mode,
      difficulty: session.difficulty,
      scores,
      dimensionLabels,
      radarData,
      questionBreakdown,
      performanceSummary,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalTimeMs: session.elapsedMs,
        questionsAnswered: session.evaluations.length,
      },
    };
  }

  private generateRadarData(
    scores: AggregatedScores
  ): ScoreReport["radarData"] {
    return [
      {
        dimension: "Accuracy",
        score: scores.dimensions.accuracy,
        fullMark: 100,
      },
      {
        dimension: "Completeness",
        score: scores.dimensions.completeness,
        fullMark: 100,
      },
      {
        dimension: "Clarity",
        score: scores.dimensions.clarity,
        fullMark: 100,
      },
      {
        dimension: "Depth",
        score: scores.dimensions.depth,
        fullMark: 100,
      },
    ];
  }

  private generateDimensionLabels(
    dimensions: AggregatedScores["dimensions"]
  ): ScoreReport["dimensionLabels"] {
    return {
      accuracy: this.aggregator.getScoreLabel(dimensions.accuracy),
      completeness: this.aggregator.getScoreLabel(dimensions.completeness),
      clarity: this.aggregator.getScoreLabel(dimensions.clarity),
      depth: this.aggregator.getScoreLabel(dimensions.depth),
    };
  }

  private generateQuestionBreakdown(
    session: ExamSession
  ): ScoreReport["questionBreakdown"] {
    return session.evaluations.map((evaluation, index) => {
      const question = session.questions.find(
        (q) => q.id === evaluation.questionId
      );
      return {
        questionId: evaluation.questionId,
        questionNumber: index + 1,
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        percentage: Math.round((evaluation.score / evaluation.maxScore) * 100),
        feedback: evaluation.feedback,
      };
    });
  }

  private generatePerformanceSummary(
    scores: AggregatedScores
  ): ScoreReport["performanceSummary"] {
    const grade = this.calculateGrade(scores.overall);
    const percentile = this.estimatePercentile(scores.overall);
    const strengths = this.identifyStrengths(scores.dimensions);
    const weaknesses = this.identifyWeaknesses(scores.dimensions);

    return {
      grade,
      percentile,
      strengths,
      weaknesses,
    };
  }

  private calculateGrade(score: number): string {
    if (score >= 93) return "A+";
    if (score >= 90) return "A";
    if (score >= 87) return "A-";
    if (score >= 83) return "B+";
    if (score >= 80) return "B";
    if (score >= 77) return "B-";
    if (score >= 73) return "C+";
    if (score >= 70) return "C";
    if (score >= 67) return "C-";
    if (score >= 60) return "D";
    return "F";
  }

  private estimatePercentile(score: number): string {
    if (score >= 95) return "Top 5%";
    if (score >= 90) return "Top 10%";
    if (score >= 80) return "Top 25%";
    if (score >= 70) return "Top 50%";
    if (score >= 60) return "Top 75%";
    return "Bottom 25%";
  }

  private identifyStrengths(
    dimensions: AggregatedScores["dimensions"]
  ): string[] {
    const strengths: string[] = [];

    if (dimensions.accuracy >= 80) {
      strengths.push("Strong technical accuracy");
    }
    if (dimensions.completeness >= 80) {
      strengths.push("Comprehensive answers");
    }
    if (dimensions.clarity >= 80) {
      strengths.push("Clear communication");
    }
    if (dimensions.depth >= 80) {
      strengths.push("Deep understanding");
    }

    if (strengths.length === 0) {
      strengths.push("Consistent performance across dimensions");
    }

    return strengths;
  }

  private identifyWeaknesses(
    dimensions: AggregatedScores["dimensions"]
  ): string[] {
    const weaknesses: string[] = [];

    if (dimensions.accuracy < 60) {
      weaknesses.push("Technical accuracy needs improvement");
    }
    if (dimensions.completeness < 60) {
      weaknesses.push("Answers lack completeness");
    }
    if (dimensions.clarity < 60) {
      weaknesses.push("Communication clarity needs work");
    }
    if (dimensions.depth < 60) {
      weaknesses.push("Depth of understanding could be stronger");
    }

    return weaknesses;
  }
}

let instance: ScoreReportGenerator | null = null;

export function getScoreReportGenerator(): ScoreReportGenerator {
  if (!instance) {
    instance = new ScoreReportGenerator();
  }
  return instance;
}

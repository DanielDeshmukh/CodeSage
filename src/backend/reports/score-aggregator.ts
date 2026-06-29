import type { ExamEvaluation, ExamSession } from "@/backend/examination/session";

export interface AggregatedScores {
  overall: number;
  dimensions: {
    accuracy: number;
    completeness: number;
    clarity: number;
    depth: number;
  };
  questionScores: Array<{
    questionId: string;
    score: number;
    maxScore: number;
    percentage: number;
  }>;
  statistics: {
    totalQuestions: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    medianScore: number;
    standardDeviation: number;
  };
}

export class ScoreAggregator {
  aggregate(session: ExamSession): AggregatedScores {
    const evaluations = session.evaluations;

    if (evaluations.length === 0) {
      return this.getEmptyScores();
    }

    const questionScores = evaluations.map((e) => ({
      questionId: e.questionId,
      score: e.score,
      maxScore: e.maxScore,
      percentage: Math.round((e.score / e.maxScore) * 100),
    }));

    const scores = evaluations.map((e) => e.score);
    const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

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

    const sortedScores = [...scores].sort((a, b) => a - b);
    const median =
      sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];

    const mean = overall;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const standardDeviation = Math.round(Math.sqrt(variance));

    return {
      overall,
      dimensions,
      questionScores,
      statistics: {
        totalQuestions: evaluations.length,
        averageScore: overall,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        medianScore: Math.round(median),
        standardDeviation,
      },
    };
  }

  aggregateMultiple(sessions: ExamSession[]): AggregatedScores {
    const allEvaluations = sessions.flatMap((s) => s.evaluations);

    if (allEvaluations.length === 0) {
      return this.getEmptyScores();
    }

    const questionScores = allEvaluations.map((e) => ({
      questionId: e.questionId,
      score: e.score,
      maxScore: e.maxScore,
      percentage: Math.round((e.score / e.maxScore) * 100),
    }));

    const scores = allEvaluations.map((e) => e.score);
    const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    const dimensions = {
      accuracy: Math.round(
        allEvaluations.reduce((sum, e) => sum + e.breakdown.accuracy, 0) / allEvaluations.length
      ),
      completeness: Math.round(
        allEvaluations.reduce((sum, e) => sum + e.breakdown.completeness, 0) / allEvaluations.length
      ),
      clarity: Math.round(
        allEvaluations.reduce((sum, e) => sum + e.breakdown.clarity, 0) / allEvaluations.length
      ),
      depth: Math.round(
        allEvaluations.reduce((sum, e) => sum + e.breakdown.depth, 0) / allEvaluations.length
      ),
    };

    const sortedScores = [...scores].sort((a, b) => a - b);
    const median =
      sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];

    const mean = overall;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const standardDeviation = Math.round(Math.sqrt(variance));

    return {
      overall,
      dimensions,
      questionScores,
      statistics: {
        totalQuestions: allEvaluations.length,
        averageScore: overall,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        medianScore: Math.round(median),
        standardDeviation,
      },
    };
  }

  private getEmptyScores(): AggregatedScores {
    return {
      overall: 0,
      dimensions: {
        accuracy: 0,
        completeness: 0,
        clarity: 0,
        depth: 0,
      },
      questionScores: [],
      statistics: {
        totalQuestions: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        medianScore: 0,
        standardDeviation: 0,
      },
    };
  }

  getScoreColor(score: number): string {
    if (score >= 80) return "#0ecb81";
    if (score >= 60) return "#ffcf25";
    if (score >= 40) return "#ffcf25";
    return "#f6465d";
  }

  getScoreLabel(score: number): string {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 50) return "Needs Improvement";
    return "Poor";
  }
}

let instance: ScoreAggregator | null = null;

export function getScoreAggregator(): ScoreAggregator {
  if (!instance) {
    instance = new ScoreAggregator();
  }
  return instance;
}

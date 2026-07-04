"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/ui/score-gauge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface ReportData {
  sessionId: string;
  repositoryId: string;
  mode: string;
  scores: {
    overall: number;
    dimensions: {
      accuracy: number;
      completeness: number;
      clarity: number;
      depth: number;
    };
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

export default function ScoreReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${sessionId}`);
        if (!res.ok) throw new Error("Failed to fetch report");
        const data = await res.json();
        setReport(data.report);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="py-20 text-center text-muted">Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="py-20 text-center text-danger">
          {error || "Report not found"}
        </div>
      </div>
    );
  }

  const dims = report.scores.dimensions;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink md:text-3xl">Score Report</h1>
          <p className="mt-2 text-muted">
            {report.repositoryId} • {report.mode} mode
          </p>
          <p className="text-sm text-muted">
            Grade: {report.performanceSummary.grade} • {report.performanceSummary.percentile}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/results">
            <Button variant="ghost">View All Reports</Button>
          </Link>
          <Link href={`/exam/select?repo=${report.repositoryId}`}>
            <Button variant="primary">Retake Exam</Button>
          </Link>
        </div>
      </div>

      {/* Overall Score */}
      <Card variant="dark" className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center">
            <ScoreGauge
              score={report.scores.overall}
              size="lg"
              label="Overall Score"
            />
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <ScoreGauge score={dims.accuracy} size="md" label="Accuracy" />
              <ScoreGauge score={dims.completeness} size="md" label="Completeness" />
              <ScoreGauge score={dims.clarity} size="md" label="Clarity" />
              <ScoreGauge score={dims.depth} size="md" label="Depth" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Breakdown */}
      <Card variant="dark" className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Dimension Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              {
                name: "Accuracy",
                score: dims.accuracy,
                description: "Technical correctness of your answers",
              },
              {
                name: "Completeness",
                score: dims.completeness,
                description: "How thoroughly you covered the topics",
              },
              {
                name: "Clarity",
                score: dims.clarity,
                description: "Quality of communication and explanation",
              },
              {
                name: "Depth",
                score: dims.depth,
                description: "Depth of understanding demonstrated",
              },
            ].map((dim) => (
              <div key={dim.name} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="w-full sm:w-32">
                  <p className="font-medium text-ink">{dim.name}</p>
                  <p className="text-xs text-muted">{dim.description}</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      className={`h-full rounded-full transition-all ${
                        dim.score >= 80
                          ? "bg-success"
                          : dim.score >= 60
                            ? "bg-primary"
                            : "bg-danger"
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
                <span
                  className={`w-12 text-right font-mono font-bold ${
                    dim.score >= 80
                      ? "text-success"
                      : dim.score >= 60
                        ? "text-primary"
                        : "text-danger"
                  }`}
                >
                  {dim.score}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-lg text-success">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.performanceSummary.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-0.5 text-success">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-lg text-danger">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.performanceSummary.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-0.5 text-danger">-</span>
                  {w}
                </li>
              ))}
              {report.performanceSummary.weaknesses.length === 0 && (
                <li className="text-sm text-muted">No significant weaknesses detected</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Question Breakdown */}
      <Card variant="dark" className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.questionBreakdown.map((q) => (
              <div key={q.questionId} className="rounded-lg border border-hairline p-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-ink">
                    {q.questionNumber}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-ink">Question {q.questionNumber}</p>
                      <span
                        className={`text-sm font-bold ${
                          q.percentage >= 80
                            ? "text-success"
                            : q.percentage >= 60
                              ? "text-primary"
                              : "text-danger"
                        }`}
                      >
                        {q.score}/{q.maxScore} ({q.percentage}%)
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{q.feedback}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card variant="dark">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
            <span>Generated: {new Date(report.metadata.generatedAt).toLocaleString()}</span>
            <span>Questions answered: {report.metadata.questionsAnswered}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

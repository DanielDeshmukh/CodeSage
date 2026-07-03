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
  completedAt: string;
  scores: {
    overall: number;
    architecture: number;
    codeDetail: number;
    scalability: number;
  };
  questionBreakdown: {
    id: string;
    question: string;
    filePath: string;
    accuracy: number;
    depth: number;
    awareness: number;
    feedback: string;
  }[];
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
            Completed on {new Date(report.completedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/results">
            <Button variant="ghost">View All Reports</Button>
          </Link>
          <Button variant="primary">Export PDF</Button>
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
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <ScoreGauge
                score={report.scores.architecture}
                size="md"
                label="Architecture"
              />
              <ScoreGauge
                score={report.scores.codeDetail}
                size="md"
                label="Code Detail"
              />
              <ScoreGauge
                score={report.scores.scalability}
                size="md"
                label="Scalability"
              />
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
                name: "Architecture",
                score: report.scores.architecture,
                description: "Understanding of system design and architectural decisions",
              },
              {
                name: "Code Detail",
                score: report.scores.codeDetail,
                description: "Knowledge of implementation details and algorithms",
              },
              {
                name: "Scalability",
                score: report.scores.scalability,
                description: "Awareness of performance and scalability considerations",
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

      {/* Question Breakdown */}
      <Card variant="dark" className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.questionBreakdown.map((q, i) => (
              <div key={q.id} className="rounded-lg border border-hairline p-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-ink">{q.question}</p>
                    <p className="mt-1 text-sm text-muted">{q.filePath}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-4">
                      <div>
                        <p className="text-xs text-muted">Accuracy</p>
                        <p
                          className={`text-sm font-bold ${
                            q.accuracy >= 80
                              ? "text-success"
                              : q.accuracy >= 60
                                ? "text-primary"
                                : "text-danger"
                          }`}
                        >
                          {q.accuracy}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Depth</p>
                        <p
                          className={`text-sm font-bold ${
                            q.depth >= 80
                              ? "text-success"
                              : q.depth >= 60
                                ? "text-primary"
                                : "text-danger"
                          }`}
                        >
                          {q.depth}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Awareness</p>
                        <p
                          className={`text-sm font-bold ${
                            q.awareness >= 80
                              ? "text-success"
                              : q.awareness >= 60
                                ? "text-primary"
                                : "text-danger"
                          }`}
                        >
                          {q.awareness}%
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted">{q.feedback}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/exam">
          <Button variant="primary">Take Another Exam</Button>
        </Link>
      </div>
    </div>
  );
}

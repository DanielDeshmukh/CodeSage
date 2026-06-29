"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/ui/score-gauge";
import Link from "next/link";

const mockReport = {
  sessionId: "1",
  repositoryName: "CodeSage",
  mode: "viva",
  completedAt: "2026-06-28T10:30:00Z",
  scores: {
    overall: 75,
    architecture: 85,
    codeDetail: 72,
    scalability: 68,
  },
  questionBreakdown: [
    {
      id: "1",
      question: "Explain the purpose of the NIM Gateway singleton pattern",
      filePath: "src/ai/nim/gateway.ts",
      accuracy: 85,
      depth: 78,
      awareness: 70,
      feedback: "Good understanding of the singleton pattern. Could elaborate more on thread safety considerations.",
    },
    {
      id: "2",
      question: "How does the AST parser handle nested function declarations?",
      filePath: "src/backend/ast/parser.ts",
      accuracy: 70,
      depth: 65,
      awareness: 60,
      feedback: "Basic understanding shown. Needs deeper knowledge of AST traversal algorithms.",
    },
    {
      id: "3",
      question: "What are the trade-offs of using in-memory session storage?",
      filePath: "src/ai/examiner/session.ts",
      accuracy: 90,
      depth: 82,
      awareness: 75,
      feedback: "Excellent analysis of scalability vs simplicity trade-offs.",
    },
  ],
};

export default function ScoreReportPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Score Report</h1>
          <p className="mt-2 text-muted">
            {mockReport.repositoryName} • {mockReport.mode} mode
          </p>
          <p className="text-sm text-muted">
            Completed on {new Date(mockReport.completedAt).toLocaleDateString()}
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
              score={mockReport.scores.overall}
              size="lg"
              label="Overall Score"
            />
            <div className="grid grid-cols-3 gap-8">
              <ScoreGauge
                score={mockReport.scores.architecture}
                size="md"
                label="Architecture"
              />
              <ScoreGauge
                score={mockReport.scores.codeDetail}
                size="md"
                label="Code Detail"
              />
              <ScoreGauge
                score={mockReport.scores.scalability}
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
                score: mockReport.scores.architecture,
                description: "Understanding of system design and architectural decisions",
              },
              {
                name: "Code Detail",
                score: mockReport.scores.codeDetail,
                description: "Knowledge of implementation details and algorithms",
              },
              {
                name: "Scalability",
                score: mockReport.scores.scalability,
                description: "Awareness of performance and scalability considerations",
              },
            ].map((dim) => (
              <div key={dim.name} className="flex items-center gap-4">
                <div className="w-32">
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
            {mockReport.questionBreakdown.map((q, i) => (
              <div key={q.id} className="rounded-lg border border-hairline p-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-ink">{q.question}</p>
                    <p className="mt-1 text-sm text-muted">{q.filePath}</p>
                    <div className="mt-3 grid grid-cols-3 gap-4">
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

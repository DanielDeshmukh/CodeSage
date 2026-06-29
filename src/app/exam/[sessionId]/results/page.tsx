"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreDisplay } from "@/components/features/score-display";
import type { ScoreReport } from "@/types";

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [report, setReport] = useState<ScoreReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      const response = await fetch(`/api/exam/${sessionId}/score`);
      if (!response.ok) {
        throw new Error("Failed to fetch score report");
      }
      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    const loadReport = async () => {
      await fetchReport();
    };
    loadReport();
  }, [fetchReport]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted">Generating score report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Card variant="dark">
          <CardContent className="py-12 text-center">
            <p className="text-danger">{error || "Report not found"}</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => router.push("/exam")}
            >
              Return to Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-dark">Exam Results</h1>
        <p className="mt-2 text-muted">
          Your performance summary and study recommendations
        </p>
      </div>

      {/* Score Display */}
      <div className="mb-8">
        <ScoreDisplay scores={report.scores} />
      </div>

      {/* Question Breakdown */}
      <Card variant="dark" className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.questionBreakdown.map((item, index) => (
              <div
                key={item.questionId}
                className="rounded-lg bg-surface p-4"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-ink">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-on-dark">{item.question}</p>
                    <p className="mt-1 text-sm text-muted">{item.filePath}</p>
                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted">Accuracy</p>
                        <p className="text-sm font-semibold text-primary">
                          {Math.round(item.accuracy * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Depth</p>
                        <p className="text-sm font-semibold text-primary">
                          {Math.round(item.depth * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Awareness</p>
                        <p className="text-sm font-semibold text-primary">
                          {Math.round(item.awareness * 100)}%
                        </p>
                      </div>
                    </div>
                    {item.feedback && (
                      <p className="mt-3 text-sm text-muted">{item.feedback}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Study Guide */}
      {report.studyGuide.length > 0 && (
        <Card variant="dark" className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Study Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.studyGuide.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-hairline bg-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-on-dark">{item.issue}</p>
                      <p className="mt-1 text-sm text-muted">
                        {item.filePath}:{item.lineNumber}
                      </p>
                      <p className="mt-2 text-sm text-muted">{item.hint}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/exam")}
        >
          New Exam
        </Button>
        <Button
          variant="primary"
          onClick={() => router.push("/repositories")}
        >
          View Repositories
        </Button>
      </div>
    </div>
  );
}

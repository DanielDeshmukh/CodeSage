"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface StrugglingArea {
  topic: string;
  description: string;
  severity: "low" | "medium" | "high";
  relatedQuestions: string[];
}

interface Recommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  resources: string[];
}

interface Hint {
  questionId: string;
  hint: string;
  concept: string;
}

interface FileReference {
  filePath: string;
  relevantConcepts: string[];
  suggestedStudy: string;
}

interface StudyGuideData {
  sessionId: string;
  strugglingAreas: StrugglingArea[];
  recommendations: Recommendation[];
  hints: Hint[];
  fileReferences: FileReference[];
  generatedAt: string;
}

const severityColors: Record<string, "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

export default function StudyGuidePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [studyGuide, setStudyGuide] = useState<StudyGuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudyGuide() {
      try {
        const res = await fetch(`/api/reports/${sessionId}?studyGuide=true`);
        if (!res.ok) throw new Error("Failed to fetch study guide");
        const data = await res.json();
        setStudyGuide(data.studyGuide || null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load study guide"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchStudyGuide();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="py-20 text-center text-muted">
          Loading study guide...
        </div>
      </div>
    );
  }

  if (error || !studyGuide) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="py-20 text-center text-danger">
          {error || "Study guide not available"}
        </div>
      </div>
    );
  }

  const totalAreas =
    studyGuide.strugglingAreas.length + studyGuide.recommendations.length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink md:text-3xl">Study Guide</h1>
        <p className="mt-2 text-muted">
          Personalized recommendations based on your exam performance
        </p>
        <p className="mt-1 text-sm text-muted">
          Generated: {new Date(studyGuide.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* Summary */}
      <Card variant="dark" className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">
                {totalAreas} Areas to Focus On
              </h2>
              <p className="text-sm text-muted">
                {studyGuide.strugglingAreas.length} struggling areas • {studyGuide.recommendations.length} recommendations • {studyGuide.fileReferences.length} file references
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Struggling Areas */}
      {studyGuide.strugglingAreas.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-ink">Struggling Areas</h2>
          <div className="space-y-4">
            {studyGuide.strugglingAreas.map((area, i) => (
              <Card key={i} variant="dark" className="border border-hairline">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        area.severity === "high"
                          ? "bg-danger/10 text-danger"
                          : area.severity === "medium"
                            ? "bg-primary/10 text-primary"
                            : "bg-info/10 text-info"
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-ink">{area.topic}</p>
                          <p className="mt-1 text-sm text-muted">
                            {area.description}
                          </p>
                        </div>
                        <Badge variant={severityColors[area.severity] || "info"}>
                          {area.severity}
                        </Badge>
                      </div>
                      {area.relatedQuestions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted">Related questions:</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {area.relatedQuestions.map((q, j) => (
                              <span key={j} className="rounded bg-surface-elevated px-2 py-0.5 text-xs text-muted">
                                {q.slice(0, 50)}...
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {studyGuide.recommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-ink">Recommendations</h2>
          <div className="space-y-4">
            {studyGuide.recommendations.map((rec, i) => (
              <Card key={i} variant="dark" className="border border-hairline">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-ink">{rec.title}</p>
                        <Badge variant={severityColors[rec.priority] || "info"}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">{rec.description}</p>
                      {rec.resources.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted">Resources:</p>
                          <ul className="mt-1 list-disc list-inside text-sm text-body space-y-1">
                            {rec.resources.map((r, j) => (
                              <li key={j}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Hints */}
      {studyGuide.hints.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-ink">Study Hints</h2>
          <div className="space-y-4">
            {studyGuide.hints.map((hint, i) => (
              <Card key={i} variant="dark" className="border border-hairline">
                <CardContent className="p-6">
                  <div className="rounded-lg bg-surface-elevated p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {hint.concept}
                      </span>
                    </div>
                    <p className="text-sm text-body">{hint.hint}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* File References */}
      {studyGuide.fileReferences.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-ink">Files to Review</h2>
          <div className="space-y-4">
            {studyGuide.fileReferences.map((ref, i) => (
              <Card key={i} variant="dark" className="border border-hairline">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-ink">{ref.filePath}</p>
                      <p className="mt-1 text-sm text-muted">{ref.suggestedStudy}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ref.relevantConcepts.map((c, j) => (
                          <span key={j} className="rounded bg-surface-elevated px-2 py-0.5 text-xs text-muted">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex justify-end gap-3">
        <Link href={`/results/${sessionId}`}>
          <Button variant="ghost">View Score Report</Button>
        </Link>
        <Link href="/exam/select">
          <Button variant="primary">Take Another Exam</Button>
        </Link>
      </div>
    </div>
  );
}

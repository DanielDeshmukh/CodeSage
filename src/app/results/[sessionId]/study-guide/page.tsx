"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface StudyGuideItem {
  id: string;
  filePath: string;
  functionName: string;
  lineNumber: number;
  issue: string;
  hint: string;
  severity: string;
}

const severityColors: Record<string, "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

export default function StudyGuidePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [studyGuide, setStudyGuide] = useState<StudyGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudyGuide() {
      try {
        const res = await fetch(`/api/reports/${sessionId}?studyGuide=true`);
        if (!res.ok) throw new Error("Failed to fetch study guide");
        const data = await res.json();
        setStudyGuide(data.studyGuide || []);
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

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="py-20 text-center text-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Study Guide</h1>
        <p className="mt-2 text-muted">
          Personalized recommendations based on your exam performance
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
                {studyGuide.length} Areas to Focus On
              </h2>
              <p className="text-sm text-muted">
                Review these specific code sections to improve your understanding
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Items */}
      {studyGuide.length === 0 ? (
        <div className="py-12 text-center text-muted">
          No study items generated yet.
        </div>
      ) : (
        <div className="space-y-4">
          {studyGuide.map((item) => (
            <Card
              key={item.id}
              variant="dark"
              className="border border-hairline"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      item.severity === "high"
                        ? "bg-danger/10 text-danger"
                        : item.severity === "medium"
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
                        <p className="font-medium text-ink">{item.issue}</p>
                        <p className="mt-1 text-sm text-muted">
                          {item.filePath}:{item.lineNumber}
                          {item.functionName && ` • ${item.functionName}()`}
                        </p>
                      </div>
                      <Badge variant={severityColors[item.severity] || "info"}>
                        {item.severity} priority
                      </Badge>
                    </div>
                    <div className="mt-4 rounded-lg bg-surface-elevated p-4">
                      <p className="mb-1 text-xs font-medium text-muted">
                        Study Hint
                      </p>
                      <p className="text-sm text-body">{item.hint}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex justify-end gap-3">
        <Link href="/results">
          <Button variant="ghost">View Score Report</Button>
        </Link>
        <Link href="/exam">
          <Button variant="primary">Take Another Exam</Button>
        </Link>
      </div>
    </div>
  );
}

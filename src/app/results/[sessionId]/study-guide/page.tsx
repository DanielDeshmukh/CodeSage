"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const mockStudyGuide = [
  {
    id: "1",
    filePath: "src/backend/ast/parser.ts",
    functionName: "parseTypeScript",
    lineNumber: 53,
    issue: "Limited understanding of AST traversal algorithms",
    hint: "Study how Abstract Syntax Trees represent code structure. Focus on tree traversal patterns (depth-first, breadth-first) and how they apply to code parsing.",
    severity: "high",
  },
  {
    id: "2",
    filePath: "src/ai/nim/gateway.ts",
    functionName: "NIMGateway",
    lineNumber: 12,
    issue: "Could elaborate on error handling strategies",
    hint: "Review how the gateway handles API failures, timeouts, and rate limiting. Consider retry patterns and circuit breaker implementations.",
    severity: "medium",
  },
  {
    id: "3",
    filePath: "src/backend/vector/qdrant.ts",
    functionName: "search",
    lineNumber: 145,
    issue: "Missing knowledge of vector similarity metrics",
    hint: "Learn about cosine similarity, dot product, and Euclidean distance. Understand when to use each metric for different types of data.",
    severity: "high",
  },
  {
    id: "4",
    filePath: "src/ai/examiner/session.ts",
    functionName: "calculateSessionScores",
    lineNumber: 180,
    issue: "Score aggregation logic needs deeper understanding",
    hint: "Study different averaging methods (mean, weighted mean, median) and when each is appropriate for scoring systems.",
    severity: "low",
  },
];

const severityColors: Record<string, "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

export default function StudyGuidePage() {
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
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">
                {mockStudyGuide.length} Areas to Focus On
              </h2>
              <p className="text-sm text-muted">
                Review these specific code sections to improve your understanding
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Items */}
      <div className="space-y-4">
        {mockStudyGuide.map((item) => (
          <Card key={item.id} variant="dark" className="border border-hairline">
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
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
                    <Badge variant={severityColors[item.severity]}>
                      {item.severity} priority
                    </Badge>
                  </div>
                  <div className="mt-4 rounded-lg bg-surface-elevated p-4">
                    <p className="text-xs font-medium text-muted mb-1">Study Hint</p>
                    <p className="text-sm text-body">{item.hint}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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

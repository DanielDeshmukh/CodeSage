"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";

interface ExamSession {
  id: string;
  repositoryId: string;
  mode: string;
  difficulty: string;
  status: string;
  startedAt: string;
  questions: unknown[];
  answers: Record<string, unknown>;
}

const modeColors: Record<string, "primary" | "success" | "info"> = {
  viva: "primary",
  interview: "success",
  "code-review": "info",
};

export default function ExamHistoryPage() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExams() {
      try {
        const res = await fetch("/api/exams");
        if (!res.ok) throw new Error("Failed to fetch exams");
        const data = await res.json();
        setSessions(data.exams || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load exams");
      } finally {
        setLoading(false);
      }
    }
    fetchExams();
  }, []);

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const scores = completedSessions
    .map((s) => Number((s.answers as Record<string, number>)?.overallScore) || 0)
    .filter((s) => s > 0);
  const totalAnswered = completedSessions.reduce(
    (sum, s) => sum + Math.max(0, Object.keys(s.answers || {}).length - 1),
    0
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Exam History</h1>
          <p className="mt-2 text-muted">
            View your past examination sessions and performance trends
          </p>
        </div>
        <Link href="/exam">
          <Button variant="primary">Start New Exam</Button>
        </Link>
      </div>

      {loading && (
        <div className="py-20 text-center text-muted">Loading exams...</div>
      )}

      {error && (
        <div className="py-20 text-center text-danger">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Stats Summary */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card variant="dark">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {completedSessions.length}
                </p>
                <p className="text-sm text-muted">Total Exams</p>
              </CardContent>
            </Card>
            <Card variant="dark">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {scores.length > 0
                    ? Math.round(
                        scores.reduce((a, b) => a + b, 0) / scores.length
                      )
                    : 0}
                  %
                </p>
                <p className="text-sm text-muted">Average Score</p>
              </CardContent>
            </Card>
            <Card variant="dark">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-success">
                  {scores.length > 0 ? Math.max(...scores) : 0}%
                </p>
                <p className="text-sm text-muted">Best Score</p>
              </CardContent>
            </Card>
            <Card variant="dark">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {totalAnswered}
                </p>
                <p className="text-sm text-muted">Questions Answered</p>
              </CardContent>
            </Card>
          </div>

          {/* Sessions Table */}
          <Card variant="dark">
            <CardHeader>
              <CardTitle className="text-lg">Past Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {completedSessions.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  No exam sessions yet. Start your first exam!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-hairline">
                        <th className="pb-3 text-left text-xs font-medium text-muted">
                          Repository
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-muted">
                          Mode
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-muted">
                          Score
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-muted">
                          Questions
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-muted">
                          Date
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-muted">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedSessions.map((session) => {
                        const score = Number((session.answers as Record<string, number>)?.overallScore) || 0;
                        const questionCount =
                          Object.keys(session.answers || {}).length - 1;
                        return (
                          <tr
                            key={session.id}
                            className="border-b border-hairline last:border-0"
                          >
                            <td className="py-4">
                              <div>
                                <p className="font-medium text-ink">
                                  {session.repositoryId}
                                </p>
                              </div>
                            </td>
                            <td className="py-4">
                              <Badge variant={modeColors[session.mode] || "primary"}>
                                {session.mode}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <span
                                className={`font-mono font-bold ${
                                  score >= 80
                                    ? "text-success"
                                    : score >= 60
                                      ? "text-primary"
                                      : "text-danger"
                                }`}
                              >
                                {score}%
                              </span>
                            </td>
                            <td className="py-4 text-sm text-body">
                              {questionCount}
                            </td>
                            <td className="py-4 text-sm text-muted">
                              {new Date(session.startedAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 text-right">
                              <Link href={`/results/${session.id}`}>
                                <Button variant="ghost" size="sm">
                                  View Report
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

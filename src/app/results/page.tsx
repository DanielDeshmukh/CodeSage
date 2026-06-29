"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const mockSessions = [
  {
    id: "1",
    repositoryName: "CodeSage",
    repositoryFullName: "DanielDeshmukh/CodeSage",
    mode: "viva",
    score: 75,
    questionsAnswered: 10,
    totalQuestions: 10,
    completedAt: "2026-06-28T10:30:00Z",
    duration: "25:30",
  },
  {
    id: "2",
    repositoryName: "Next.js",
    repositoryFullName: "vercel/next.js",
    mode: "interview",
    score: 82,
    questionsAnswered: 8,
    totalQuestions: 10,
    completedAt: "2026-06-27T15:45:00Z",
    duration: "22:15",
  },
  {
    id: "3",
    repositoryName: "React",
    repositoryFullName: "facebook/react",
    mode: "code-review",
    score: 68,
    questionsAnswered: 10,
    totalQuestions: 10,
    completedAt: "2026-06-26T09:20:00Z",
    duration: "30:45",
  },
  {
    id: "4",
    repositoryName: "TypeScript",
    repositoryFullName: "microsoft/TypeScript",
    mode: "viva",
    score: 91,
    questionsAnswered: 10,
    totalQuestions: 10,
    completedAt: "2026-06-25T14:10:00Z",
    duration: "28:00",
  },
];

const modeColors = {
  viva: "primary",
  interview: "success",
  "code-review": "info",
} as const;

export default function ExamHistoryPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-dark">Exam History</h1>
          <p className="mt-2 text-muted">
            View your past examination sessions and performance trends
          </p>
        </div>
        <Link href="/exam">
          <Button variant="primary">Start New Exam</Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card variant="dark">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{mockSessions.length}</p>
            <p className="text-sm text-muted">Total Exams</p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {Math.round(
                mockSessions.reduce((sum, s) => sum + s.score, 0) /
                  mockSessions.length
              )}
              %
            </p>
            <p className="text-sm text-muted">Average Score</p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {Math.max(...mockSessions.map((s) => s.score))}%
            </p>
            <p className="text-sm text-muted">Best Score</p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {mockSessions.reduce((sum, s) => sum + s.questionsAnswered, 0)}
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
                    Duration
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
                {mockSessions.map((session) => (
                  <tr
                    key={session.id}
                    className="border-b border-hairline last:border-0"
                  >
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-on-dark">
                          {session.repositoryName}
                        </p>
                        <p className="text-xs text-muted">
                          {session.repositoryFullName}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant={modeColors[session.mode]}>
                        {session.mode}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <span
                        className={`font-mono font-bold ${
                          session.score >= 80
                            ? "text-success"
                            : session.score >= 60
                              ? "text-primary"
                              : "text-danger"
                        }`}
                      >
                        {session.score}%
                      </span>
                    </td>
                    <td className="py-4 text-sm text-body">
                      {session.questionsAnswered}/{session.totalQuestions}
                    </td>
                    <td className="py-4 font-mono text-sm text-body">
                      {session.duration}
                    </td>
                    <td className="py-4 text-sm text-muted">
                      {new Date(session.completedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <Link href={`/results/${session.id}`}>
                        <Button variant="ghost" size="sm">
                          View Report
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

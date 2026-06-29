"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const mockRepositories = [
  {
    id: "1",
    name: "codesage",
    fullName: "DanielDeshmukh/CodeSage",
    language: "TypeScript",
    status: "ready" as const,
    stars: 12,
    chunks: 156,
  },
  {
    id: "2",
    name: "next.js",
    fullName: "vercel/next.js",
    language: "TypeScript",
    status: "ready" as const,
    stars: 128000,
    chunks: 4521,
  },
  {
    id: "3",
    name: "react",
    fullName: "facebook/react",
    language: "JavaScript",
    status: "indexing" as const,
    stars: 230000,
    chunks: 0,
  },
];

const mockSessions = [
  {
    id: "1",
    repositoryName: "codesage",
    mode: "viva",
    score: 75,
    completedAt: "2026-06-28T10:30:00Z",
  },
  {
    id: "2",
    repositoryName: "next.js",
    mode: "interview",
    score: 82,
    completedAt: "2026-06-27T15:45:00Z",
  },
];

const statusColors = {
  pending: "muted",
  cloning: "info",
  parsing: "info",
  indexing: "info",
  ready: "success",
  error: "danger",
} as const;

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-dark">Dashboard</h1>
        <p className="mt-2 text-muted">
          Overview of your repositories and exam sessions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="dark">
          <CardContent className="p-6">
            <p className="text-sm text-muted">Total Repositories</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {mockRepositories.length}
            </p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="p-6">
            <p className="text-sm text-muted">Exam Sessions</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {mockSessions.length}
            </p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="p-6">
            <p className="text-sm text-muted">Average Score</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {Math.round(
                mockSessions.reduce((sum, s) => sum + s.score, 0) /
                  mockSessions.length
              )}
              %
            </p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="p-6">
            <p className="text-sm text-muted">Total Chunks</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {mockRepositories
                .reduce((sum, r) => sum + r.chunks, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Repositories */}
        <Card variant="dark">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Repositories</CardTitle>
            <Link href="/repositories">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRepositories.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between rounded-lg border border-hairline p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-on-dark truncate">
                      {repo.name}
                    </p>
                    <p className="text-xs text-muted truncate">{repo.fullName}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span className="text-xs text-muted">{repo.language}</span>
                    <Badge variant={statusColors[repo.status]} dot>
                      {repo.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card variant="dark">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
            <Link href="/results">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-hairline p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-on-dark">
                      {session.repositoryName}
                    </p>
                    <p className="text-xs text-muted capitalize">
                      {session.mode} mode
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span
                      className={`text-lg font-bold ${
                        session.score >= 70
                          ? "text-success"
                          : session.score >= 50
                            ? "text-primary"
                            : "text-danger"
                      }`}
                    >
                      {session.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/repositories" className="block">
          <Card variant="dark" className="transition-colors hover:bg-surface-elevated">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-on-dark">Add Repository</p>
                <p className="text-sm text-muted">Connect a new GitHub repo</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/exam" className="block">
          <Card variant="dark" className="transition-colors hover:bg-surface-elevated">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-on-dark">Start Exam</p>
                <p className="text-sm text-muted">Test your code knowledge</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/results" className="block">
          <Card variant="dark" className="transition-colors hover:bg-surface-elevated">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10 text-info">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-on-dark">View Reports</p>
                <p className="text-sm text-muted">Review your scores</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

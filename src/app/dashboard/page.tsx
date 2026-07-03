"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Repository {
  id: string;
  name: string;
  url: string;
  stats: Record<string, unknown>;
  createdAt: string;
}

interface Exam {
  id: string;
  repositoryId: string;
  mode: string;
  difficulty: string;
  status: string;
  startedAt: string;
  questions: unknown[];
  answers: unknown[];
}

export default function DashboardPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reposRes, examsRes] = await Promise.all([
          fetch("/api/repos"),
          fetch("/api/exams"),
        ]);

        if (!reposRes.ok || !examsRes.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const reposData = await reposRes.json();
        const examsData = await examsRes.json();

        setRepositories(reposData.repositories ?? []);
        setExams(examsData.exams ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink md:text-3xl">Dashboard</h1>
          <p className="mt-2 text-muted">
            Overview of your repositories and exam sessions
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink md:text-3xl">Dashboard</h1>
          <p className="mt-2 text-muted">
            Overview of your repositories and exam sessions
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-danger">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const averageScore =
    exams.length > 0
      ? Math.round(exams.filter((e) => e.answers.length > 0).length > 0
          ? exams.reduce((sum, e) => {
              const score =
                e.answers.length > 0
                  ? Math.round((e.answers.length / e.questions.length) * 100)
                  : 0;
              return sum + score;
            }, 0) / exams.filter((e) => e.answers.length > 0).length
          : 0)
      : 0;

  const totalChunks = repositories.reduce((sum, r) => {
    const stats = r.stats as { chunks?: number } | undefined;
    return sum + (stats?.chunks ?? 0);
  }, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink md:text-3xl">Dashboard</h1>
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
              {repositories.length}
            </p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="p-6">
            <p className="text-sm text-muted">Exam Sessions</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {exams.length}
            </p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="p-6">
            <p className="text-sm text-muted">Average Score</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {averageScore}%
            </p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="p-6">
            <p className="text-sm text-muted">Total Chunks</p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {totalChunks.toLocaleString()}
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
            {repositories.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <p className="text-muted">No repositories yet</p>
                <Link href="/repositories">
                  <Button variant="ghost" size="sm">
                    Add Repository
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between rounded-lg border border-hairline p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">
                        {repo.name}
                      </p>
                      <p className="text-xs text-muted truncate">{repo.url}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <span className="text-xs text-muted">
                        {new Date(repo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {exams.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <p className="text-muted">No exam sessions yet</p>
                <Link href="/exam">
                  <Button variant="ghost" size="sm">
                    Start Exam
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => {
                  const score =
                    exam.questions.length > 0
                      ? Math.round((exam.answers.length / exam.questions.length) * 100)
                      : 0;
                  return (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between rounded-lg border border-hairline p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink">
                          {exam.repositoryId}
                        </p>
                        <p className="text-xs text-muted capitalize">
                          {exam.mode} mode
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-3">
                        <span
                          className={`text-lg font-bold ${
                            score >= 70
                              ? "text-success"
                              : score >= 50
                                ? "text-primary"
                                : "text-danger"
                          }`}
                        >
                          {score}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                <p className="font-medium text-ink">Add Repository</p>
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
                <p className="font-medium text-ink">Start Exam</p>
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
                <p className="font-medium text-ink">View Reports</p>
                <p className="text-sm text-muted">Review your scores</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

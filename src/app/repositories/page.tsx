"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Repo {
  id: string;
  name: string;
  url: string;
  stats: { chunks?: number; sourceFiles?: number; totalLines?: number };
  createdAt: string;
}

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/repos")
      .then((r) => r.json())
      .then((d) => setRepos(d.repositories ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink md:text-3xl">Repositories</h1>
          <p className="mt-2 text-muted">Manage and review your analyzed codebases</p>
        </div>
        <Link href="/repositories/submit">
          <Button variant="primary">Add Repository</Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted">Loading repositories...</div>
      ) : repos.length === 0 ? (
        <Card variant="dark">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <p className="text-muted">No repositories yet</p>
            <Link href="/repositories/submit">
              <Button variant="primary" size="sm">
                Add Your First Repository
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <Card key={repo.id} variant="dark">
              <CardHeader>
                <CardTitle className="truncate text-base">{repo.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted">
                  {repo.stats?.sourceFiles != null && (
                    <span>{repo.stats.sourceFiles} files</span>
                  )}
                  {repo.stats?.chunks != null && (
                    <span>{repo.stats.chunks} chunks</span>
                  )}
                  {repo.stats?.totalLines != null && (
                    <span>{repo.stats.totalLines.toLocaleString()} lines</span>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/repositories/analyze?url=${encodeURIComponent(repo.url)}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      Analyze
                    </Button>
                  </Link>
                  <Link href={`/exam/select?repo=${repo.id}`}>
                    <Button variant="ghost" size="sm">
                      Exam
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

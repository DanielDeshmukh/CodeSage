"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function RepositorySubmitPage() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateUrl = (url: string): boolean => {
    const githubPattern =
      /^(https?:\/\/)?(www\.)?github\.com\/[^/]+\/[^/]+(\/)?$/;
    return githubPattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!githubUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    if (!validateUrl(githubUrl)) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)");
      return;
    }

    setIsLoading(true);
    try {
      // For now, redirect to analysis page
      router.push(`/repositories/analyze?url=${encodeURIComponent(githubUrl)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Add Repository</h1>
        <p className="mt-2 text-muted">
          Connect a GitHub repository to analyze with AI
        </p>
      </div>

      <Card variant="dark">
        <CardHeader>
          <CardTitle className="text-lg">Repository URL</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                variant="dark"
                placeholder="https://github.com/owner/repo"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  setError(null);
                }}
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                }
              />
              {error && (
                <p className="mt-2 text-sm text-danger">{error}</p>
              )}
            </div>

            <div className="rounded-lg bg-surface-elevated p-4">
              <h3 className="text-sm font-medium text-ink">
                What happens next?
              </h3>
              <ul className="mt-2 space-y-2 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">1.</span>
                  <span>We&apos;ll clone the repository and analyze its structure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">2.</span>
                  <span>Source code will be parsed into logical chunks using AST</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">3.</span>
                  <span>Chunks will be embedded and indexed for intelligent retrieval</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">4.</span>
                  <span>You can then start an exam session to test your knowledge</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/repositories">
                <Button variant="ghost">Cancel</Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={!githubUrl.trim()}
                isLoading={isLoading}
              >
                Add Repository
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

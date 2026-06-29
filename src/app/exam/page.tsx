"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExamMode } from "@/types";

const examModes: { value: ExamMode; label: string; description: string }[] = [
  {
    value: "viva",
    label: "Viva Voce",
    description: "Deep dive into code understanding with follow-up questions",
  },
  {
    value: "interview",
    label: "Interview Prep",
    description: "Technical interview style questions and evaluation",
  },
  {
    value: "code-review",
    label: "Code Review",
    description: "Identify issues and improvement opportunities",
  },
];

export default function ExamPage() {
  const router = useRouter();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [selectedMode, setSelectedMode] = useState<ExamMode>("viva");
  const [questionCount, setQuestionCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartExam = async () => {
    if (!repositoryUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryUrl: repositoryUrl.trim(),
          mode: selectedMode,
          questionCount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create exam session");
      }

      const { session } = await response.json();
      router.push(`/exam/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-dark">Start Exam Session</h1>
        <p className="mt-2 text-muted">
          Test your understanding of a codebase with AI-powered questions
        </p>
      </div>

      <div className="space-y-6">
        {/* Repository URL */}
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-lg">Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              variant="dark"
              placeholder="https://github.com/owner/repo"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              }
            />
          </CardContent>
        </Card>

        {/* Exam Mode */}
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-lg">Exam Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {examModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setSelectedMode(mode.value)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedMode === mode.value
                      ? "border-primary bg-primary/10"
                      : "border-hairline bg-surface hover:bg-surface-elevated"
                  }`}
                >
                  <p
                    className={`font-medium ${
                      selectedMode === mode.value
                        ? "text-primary"
                        : "text-on-dark"
                    }`}
                  >
                    {mode.label}
                  </p>
                  <p className="mt-1 text-sm text-muted">{mode.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Count */}
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-lg">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-muted">Number of questions:</span>
              <div className="flex items-center gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      questionCount === count
                        ? "bg-primary text-ink"
                        : "bg-surface text-on-dark hover:bg-surface-elevated"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Start Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartExam}
            disabled={!repositoryUrl.trim() || isLoading}
            isLoading={isLoading}
          >
            Start Exam
          </Button>
        </div>
      </div>
    </div>
  );
}

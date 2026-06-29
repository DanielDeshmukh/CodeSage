"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import Link from "next/link";

type AnalysisStep = "cloning" | "parsing" | "embedding" | "indexing" | "complete";

const steps: { key: AnalysisStep; label: string }[] = [
  { key: "cloning", label: "Cloning Repository" },
  { key: "parsing", label: "Parsing Source Code" },
  { key: "embedding", label: "Generating Embeddings" },
  { key: "indexing", label: "Indexing to Vector Store" },
];

export default function RepositoryAnalysisPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("url") || "";

  const [currentStep, setCurrentStep] = useState<AnalysisStep>("cloning");
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    files: 0,
    chunks: 0,
    lines: 0,
    languages: [] as string[],
  });

  useEffect(() => {
    // Simulate analysis progress
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    // Simulate step progression
    const stepTimer = setTimeout(() => setCurrentStep("parsing"), 2000);
    const stepTimer2 = setTimeout(() => setCurrentStep("embedding"), 4000);
    const stepTimer3 = setTimeout(() => setCurrentStep("indexing"), 6000);
    const stepTimer4 = setTimeout(() => {
      setCurrentStep("complete");
      setStats({
        files: 47,
        chunks: 156,
        lines: 3240,
        languages: ["TypeScript", "JavaScript", "CSS"],
      });
    }, 8000);

    return () => {
      clearInterval(timer);
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
    };
  }, []);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-dark">Analyzing Repository</h1>
        <p className="mt-2 text-muted truncate">{repoUrl}</p>
      </div>

      {/* Progress Card */}
      <Card variant="dark" className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Analysis Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar value={progress} showLabel />

          {/* Steps */}
          <div className="mt-8 space-y-4">
            {steps.map((step, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      isComplete
                        ? "bg-success text-on-dark"
                        : isCurrent
                          ? "bg-primary text-ink"
                          : "bg-surface-elevated text-muted"
                    }`}
                  >
                    {isComplete ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isCurrent
                          ? "text-on-dark"
                          : isComplete
                            ? "text-success"
                            : "text-muted"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {isCurrent && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats (shown after completion) */}
      {currentStep === "complete" && (
        <Card variant="dark" className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Analysis Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-surface-elevated p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.files}</p>
                <p className="text-sm text-muted">Files</p>
              </div>
              <div className="rounded-lg bg-surface-elevated p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.chunks}</p>
                <p className="text-sm text-muted">Chunks</p>
              </div>
              <div className="rounded-lg bg-surface-elevated p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.lines.toLocaleString()}
                </p>
                <p className="text-sm text-muted">Lines</p>
              </div>
              <div className="rounded-lg bg-surface-elevated p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.languages.length}
                </p>
                <p className="text-sm text-muted">Languages</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-on-dark">Languages Detected</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stats.languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-surface px-3 py-1 text-xs text-muted"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Link href="/repositories">
                <Button variant="ghost">View All Repos</Button>
              </Link>
              <Link href={`/exam?repo=${encodeURIComponent(repoUrl)}`}>
                <Button variant="primary">Start Exam</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

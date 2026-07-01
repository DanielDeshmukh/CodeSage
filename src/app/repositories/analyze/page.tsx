"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import Link from "next/link";

type AnalysisStep = "analyzing" | "complete" | "error";

const steps: { key: AnalysisStep; label: string }[] = [
  { key: "analyzing", label: "Analyzing Repository" },
  { key: "complete", label: "Complete" },
];

interface AnalysisResult {
  success: boolean;
  repositoryId: string;
  stats: {
    files: number;
    chunks: number;
    lines: number;
    languages: string[];
  };
  error?: string;
  durationMs?: number;
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams?.get("url") || "";

  const [step, setStep] = useState<AnalysisStep>("analyzing");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!repoUrl) {
      setStep("error");
      return;
    }

    let cancelled = false;

    const analyze = async () => {
      try {
        const res = await fetch("/api/repos/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl }),
        });

        if (cancelled) return;

        const data = await res.json();

        if (!cancelled) {
          if (data.success) {
            setResult(data);
            setProgress(100);
            setStep("complete");
          } else {
            setResult(data);
            setStep("error");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setStep("error");
          setResult({
            success: false,
            repositoryId: "",
            stats: { files: 0, chunks: 0, lines: 0, languages: [] },
            error: err instanceof Error ? err.message : "An unexpected error occurred",
          });
        }
      }
    };

    analyze();

    return () => {
      cancelled = true;
    };
  }, [repoUrl]);

  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const isAnalyzing = step === "analyzing";
  const isComplete = step === "complete";
  const isError = step === "error";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Analyzing Repository</h1>
        <p className="mt-2 text-muted truncate">{repoUrl}</p>
      </div>

      {/* Progress Card */}
      <Card variant="dark" className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Analysis Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar value={isComplete ? 100 : isAnalyzing ? progress : 0} showLabel />

          {/* Steps */}
          <div className="mt-8 space-y-4">
            {steps.map((s, index) => {
              const isCompleteStep = index < currentStepIndex || (s.key === "complete" && isComplete);
              const isCurrent = s.key === step;
              return (
                <div key={s.key} className="flex items-center gap-4">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      isCompleteStep && s.key !== "analyzing"
                        ? "bg-success text-ink"
                        : isCurrent
                          ? "bg-primary text-ink"
                          : "bg-surface-elevated text-muted"
                    }`}
                  >
                    {isCompleteStep && s.key === "complete" ? (
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
                          ? "text-ink"
                          : isCompleteStep
                            ? "text-success"
                            : "text-muted"
                      }`}
                    >
                      {s.label}
                    </p>
                  </div>
                  {isCurrent && isAnalyzing && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {isError && result?.error && (
        <Card variant="dark" className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-error">Analysis Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted">{result.error}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Link href="/repositories">
                <Button variant="ghost">View All Repos</Button>
              </Link>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats (shown after completion) */}
      {isComplete && result?.stats && (
        <Card variant="dark" className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Analysis Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-surface-elevated p-4 text-center">
                <p className="text-2xl font-bold text-primary">{result.stats.files}</p>
                <p className="text-sm text-muted">Files</p>
              </div>
              <div className="rounded-lg bg-surface-elevated p-4 text-center">
                <p className="text-2xl font-bold text-primary">{result.stats.chunks}</p>
                <p className="text-sm text-muted">Chunks</p>
              </div>
              <div className="rounded-lg bg-surface-elevated p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {result.stats.lines.toLocaleString()}
                </p>
                <p className="text-sm text-muted">Lines</p>
              </div>
              <div className="rounded-lg bg-surface-elevated p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {result.stats.languages.length}
                </p>
                <p className="text-sm text-muted">Languages</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-ink">Languages Detected</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.stats.languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-surface px-3 py-1 text-xs text-muted"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {result.durationMs && (
              <p className="mt-4 text-sm text-muted">
                Completed in {(result.durationMs / 1000).toFixed(1)}s
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Link href="/repositories">
                <Button variant="ghost">View All Repos</Button>
              </Link>
              <Link href={`/exam/select?repo=${encodeURIComponent(result.repositoryId)}`}>
                <Button variant="primary">Start Exam</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RepositoryAnalysisPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-6 py-12 text-muted">Loading analysis...</div>}>
      <AnalysisContent />
    </Suspense>
  );
}

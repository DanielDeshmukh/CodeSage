"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ui/progress-bar";

interface Question {
  id: string;
  question: string;
  filePath: string;
  functionName: string;
  lineNumber: number;
  language: string;
  codeContext: string;
}

interface ExamSession {
  sessionId: string;
  status: string;
  questions: Question[];
  timeLimitMs: number;
}

interface Evaluation {
  score: number;
  feedback: string;
}

interface AnswerResponse {
  evaluation: Evaluation;
  followUp: string | null;
  isComplete: boolean;
}

export default function ExamSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = params.mode as string;
  const repositoryId = searchParams.get("repo") || "";

  const [session, setSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [lastEvaluation, setLastEvaluation] = useState<Evaluation | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = session?.questions[currentQuestionIndex] || null;

  const startExam = useCallback(async () => {
    if (!repositoryId) {
      setError("No repository specified. Please select a repository first.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/exams/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId, mode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start exam session");
      }

      const data: ExamSession = await response.json();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start exam session");
    } finally {
      setIsLoading(false);
    }
  }, [repositoryId, mode]);

  const completeSession = useCallback(async () => {
    if (!session) return;

    try {
      setIsCompleting(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const response = await fetch(`/api/exams/${session.sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete session");
      }

      router.push(`/results/${session.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete session");
    } finally {
      setIsCompleting(false);
    }
  }, [session, router]);

  const submitAnswer = useCallback(async () => {
    if (!session || !answer.trim()) return;

    try {
      setIsSubmitting(true);
      setLastEvaluation(null);
      const response = await fetch(`/api/exams/${session.sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit answer");
      }

      const data: AnswerResponse = await response.json();
      setLastEvaluation(data.evaluation);
      setAnswers((prev) => ({ ...prev, [currentQuestion!.id]: answer }));
      setAnswer("");

      if (data.isComplete) {
        await completeSession();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  }, [session, answer, currentQuestion, completeSession]);

  const handleNext = () => {
    if (!session) return;
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setAnswer(answers[session.questions[currentQuestionIndex + 1]?.id] || "");
      setLastEvaluation(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setAnswer(answers[session!.questions[currentQuestionIndex - 1]?.id] || "");
      setLastEvaluation(null);
    }
  };

  useEffect(() => {
    startExam();
  }, [startExam]);

  useEffect(() => {
    if (session && !isCompleting) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [session, isCompleting]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted">Starting exam session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-ink">Error</p>
          <p className="mt-2 text-muted">{error}</p>
          <Button variant="primary" className="mt-6" onClick={() => router.push("/exams")}>
            Return to Exams
          </Button>
        </div>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return null;
  }

  const totalQuestions = session.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Exam Session</h1>
          <p className="mt-1 text-muted">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-muted">Time Elapsed</p>
            <p className="font-mono text-lg font-bold text-ink">
              {Math.floor(timeElapsed / 60)
                .toString()
                .padStart(2, "0")}
              :{(timeElapsed % 60).toString().padStart(2, "0")}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={completeSession} disabled={isCompleting}>
            {isCompleting ? "Ending..." : "End Session"}
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <ProgressBar
          value={answeredCount}
          max={totalQuestions}
          showLabel
          size="sm"
        />
      </div>

      <Card variant="dark" className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-ink">
              {currentQuestionIndex + 1}
            </span>
            <div className="flex-1">
              <CardTitle className="text-lg leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {currentQuestion.filePath}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {currentQuestion.functionName}
                </span>
                <span>Line {currentQuestion.lineNumber}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentQuestion.codeContext && (
            <div className="rounded-lg bg-surface-elevated p-4">
              <p className="text-xs font-medium text-muted mb-2">Code Context</p>
              <pre className="font-mono text-sm text-body overflow-x-auto">
                {currentQuestion.codeContext}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="dark" className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Your Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            variant="dark"
            placeholder="Type your answer here... Explain the purpose, implementation details, and benefits of this function."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted">
              {answer.length > 0
                ? `${answer.split(/\s+/).length} words`
                : "Start typing your answer"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                onClick={handleNext}
                disabled={currentQuestionIndex === totalQuestions - 1}
              >
                Skip
              </Button>
              <Button
                variant="primary"
                disabled={!answer.trim()}
                isLoading={isSubmitting}
                onClick={submitAnswer}
              >
                Submit Answer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {lastEvaluation && (
        <Card variant="dark" className="mb-6 border border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <span className="text-sm text-muted">Score: </span>
              <span className="font-bold text-ink">{lastEvaluation.score}/100</span>
            </div>
            <p className="text-body">{lastEvaluation.feedback}</p>
          </CardContent>
        </Card>
      )}

      <Card variant="dark" className="border border-hairline">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-ink">Answering Tips</p>
              <p className="mt-1 text-sm text-muted">
                Be specific about implementation details. Mention the file path, function name, and line numbers
                when relevant. Explain the &quot;why&quot; behind decisions, not just the &quot;what&quot;.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

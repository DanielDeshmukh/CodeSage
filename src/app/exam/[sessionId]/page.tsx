"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/features/question-card";
import { ScoreDisplay } from "@/components/features/score-display";
import type { ExamSession, ExamQuestion } from "@/types";

export default function ExamSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/exam?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch session");
      }
      const data = await response.json();
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (questionId: string, answer: string) => {
    try {
      const response = await fetch(`/api/exam/${sessionId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId, answer }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      const data = await response.json();

      // Update session with new scores
      if (session) {
        setSession({
          ...session,
          scores: data.scores,
        });
      }

      // Move to next question if available
      if (session && currentQuestionIndex < session.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }

      // Refresh session data
      fetchSession();
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  };

  const handleViewResults = () => {
    router.push(`/exam/${sessionId}/results`);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted">Loading exam session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Card variant="dark">
          <CardContent className="py-12 text-center">
            <p className="text-danger">{error || "Session not found"}</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => router.push("/exam")}
            >
              Return to Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const isComplete = session.status === "completed";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Session Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-dark">
            {session.mode === "viva"
              ? "Viva Voce"
              : session.mode === "interview"
                ? "Interview Prep"
                : "Code Review"}{" "}
            Session
          </h1>
          <p className="mt-1 text-muted">
            Question {currentQuestionIndex + 1} of {session.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted">Overall Score</p>
            <p className="text-2xl font-bold text-primary">
              {Math.round(session.scores.overall * 100)}%
            </p>
          </div>
          {isComplete && (
            <Button variant="primary" onClick={handleViewResults}>
              View Results
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / session.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="mb-8">
          <QuestionCard
            question={currentQuestion}
            index={currentQuestionIndex}
            onAnswer={handleAnswer}
          />
        </div>
      )}

      {/* Score Summary */}
      {!isComplete && (
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="text-lg">Current Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted">Answered</p>
                <p className="text-xl font-semibold text-on-dark">
                  {session.questions.filter((q) => q.answer).length} /{" "}
                  {session.questions.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Accuracy</p>
                <p className="text-xl font-semibold text-primary">
                  {Math.round(session.scores.architecture * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Depth</p>
                <p className="text-xl font-semibold text-primary">
                  {Math.round(session.scores.codeDetail * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Score Display */}
      {isComplete && (
        <div className="mt-8">
          <ScoreDisplay scores={session.scores} />
        </div>
      )}
    </div>
  );
}

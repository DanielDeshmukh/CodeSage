"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ExamQuestion } from "@/types";

interface QuestionCardProps {
  question: ExamQuestion;
  index: number;
  onAnswer?: (questionId: string, answer: string) => void;
}

export function QuestionCard({ question, index, onAnswer }: QuestionCardProps) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setIsSubmitting(true);
    try {
      onAnswer?.(question.id, answer);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="dark">
      <CardHeader>
        <div className="flex items-start gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-ink">
            {index + 1}
          </span>
          <div className="flex-1">
            <CardTitle className="text-base">{question.question}</CardTitle>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {question.filePath}
              </span>
              {question.functionName && (
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {question.functionName}
                </span>
              )}
              <span>Line {question.lineNumber}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {question.answer ? (
          <div className="rounded-lg bg-surface-elevated p-4">
            <p className="text-sm text-on-dark">{question.answer.content}</p>
            {question.answer.evaluation && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted">Accuracy</p>
                  <p className="text-lg font-semibold text-primary">
                    {Math.round(question.answer.evaluation.accuracy * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Depth</p>
                  <p className="text-lg font-semibold text-primary">
                    {Math.round(question.answer.evaluation.depth * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Awareness</p>
                  <p className="text-lg font-semibold text-primary">
                    {Math.round(question.answer.evaluation.awareness * 100)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              className="w-full rounded-lg border border-hairline bg-surface p-4 text-sm text-on-dark placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-info focus:ring-offset-2 focus:ring-offset-canvas-dark min-h-[120px] resize-none"
              placeholder="Type your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={!answer.trim()}
                isLoading={isSubmitting}
              >
                Submit Answer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

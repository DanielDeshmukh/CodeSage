"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ui/progress-bar";

const mockQuestion = {
  id: "1",
  question:
    "Can you explain the purpose and implementation of the `getNIMGateway` function? Why is it implemented as a singleton, and what are the benefits of this pattern in this context?",
  filePath: "src/ai/nim/gateway.ts",
  functionName: "getNIMGateway",
  lineNumber: 180,
  language: "typescript",
};

export default function ExamSessionPage() {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentQuestion] = useState(1);
  const totalQuestions = 10;

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setIsSubmitting(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitting(false);
    setAnswer("");
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Exam Session</h1>
          <p className="mt-1 text-muted">
            Question {currentQuestion} of {totalQuestions}
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
          <Button variant="ghost" size="sm">
            End Session
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <ProgressBar
          value={currentQuestion}
          max={totalQuestions}
          showLabel
          size="sm"
        />
      </div>

      {/* Question Card */}
      <Card variant="dark" className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-ink">
              {currentQuestion}
            </span>
            <div className="flex-1">
              <CardTitle className="text-lg leading-relaxed">
                {mockQuestion.question}
              </CardTitle>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {mockQuestion.filePath}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {mockQuestion.functionName}
                </span>
                <span>Line {mockQuestion.lineNumber}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-surface-elevated p-4">
            <p className="text-xs font-medium text-muted mb-2">Code Context</p>
            <pre className="font-mono text-sm text-body overflow-x-auto">
              {`export function getNIMGateway(): NIMGateway {
  if (!nimInstance) {
    nimInstance = new NIMGateway();
  }
  return nimInstance;
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Answer Input */}
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
              <Button variant="ghost">Skip Question</Button>
              <Button
                variant="primary"
                disabled={!answer.trim()}
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                Submit Answer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
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

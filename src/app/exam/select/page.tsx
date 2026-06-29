"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const examModes = [
  {
    id: "viva",
    title: "Viva Voce",
    description:
      "Deep dive into code understanding with follow-up questions. Tests your ability to explain implementation decisions and architectural choices.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    features: [
      "Probing follow-up questions",
      "Architecture decision testing",
      "Implementation detail deep-dive",
      "Code comprehension verification",
    ],
    difficulty: "Advanced",
    color: "primary",
  },
  {
    id: "interview",
    title: "Interview Prep",
    description:
      "Technical interview style questions and evaluation. Prepare for real interviews with questions that test system design thinking.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    features: [
      "System design questions",
      "Problem-solving approach",
      "Code comprehension assessment",
      "Best practices evaluation",
    ],
    difficulty: "Intermediate",
    color: "success",
  },
  {
    id: "code-review",
    title: "Code Review",
    description:
      "Identify issues and improvement opportunities in your codebase. Learn to spot bugs, performance bottlenecks, and design flaws.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    features: [
      "Bug detection",
      "Performance bottleneck identification",
      "Security vulnerability awareness",
      "Code quality improvement",
    ],
    difficulty: "All Levels",
    color: "info",
  },
];

const difficultyColors: Record<string, "success" | "primary" | "info"> = {
  Intermediate: "success",
  Advanced: "primary",
  "All Levels": "info",
};

export default function ExamModeSelectionPage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const handleStartExam = () => {
    if (selectedMode) {
      router.push(`/exam/${selectedMode}`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-on-dark">Choose Exam Mode</h1>
        <p className="mt-2 text-muted">
          Select the type of examination that best suits your goals
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {examModes.map((mode) => (
          <Card
            key={mode.id}
            variant="dark"
            className={`cursor-pointer transition-all ${
              selectedMode === mode.id
                ? "ring-2 ring-primary"
                : "hover:bg-surface-elevated"
            }`}
            onClick={() => setSelectedMode(mode.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                    mode.color === "primary"
                      ? "bg-primary/10 text-primary"
                      : mode.color === "success"
                        ? "bg-success/10 text-success"
                        : "bg-info/10 text-info"
                  }`}
                >
                  {mode.icon}
                </div>
                <Badge variant={difficultyColors[mode.difficulty]}>
                  {mode.difficulty}
                </Badge>
              </div>
              <CardTitle className="mt-4 text-xl">{mode.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">{mode.description}</p>
              <ul className="mt-4 space-y-2">
                {mode.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-body">
                    <svg
                      className={`h-4 w-4 ${
                        mode.color === "primary"
                          ? "text-primary"
                          : mode.color === "success"
                            ? "text-success"
                            : "text-info"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          variant="primary"
          size="lg"
          disabled={!selectedMode}
          onClick={handleStartExam}
        >
          Start {selectedMode ? examModes.find((m) => m.id === selectedMode)?.title : "Exam"}
        </Button>
      </div>
    </div>
  );
}

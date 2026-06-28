import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreDisplay } from "@/components/features/score-display";
import Link from "next/link";

const mockScores = {
  architecture: 0.85,
  codeDetail: 0.72,
  scalability: 0.68,
  overall: 0.75,
};

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-on-dark sm:text-5xl">
          Welcome to{" "}
          <span className="text-primary">CodeSage</span>
        </h1>
        <p className="mt-4 text-lg text-muted max-w-2xl">
          AI-powered codebase examiner for viva preparation, project review, and
          interview readiness. Understand your code deeply.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/repositories">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="secondary-dark" size="lg">
              View Documentation
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        <Card variant="dark">
          <CardContent className="pt-6">
            <p className="text-sm text-muted">Repositories Analyzed</p>
            <p className="text-3xl font-bold text-primary mt-2">0</p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="pt-6">
            <p className="text-sm text-muted">Questions Generated</p>
            <p className="text-3xl font-bold text-primary mt-2">0</p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="pt-6">
            <p className="text-sm text-muted">Exams Completed</p>
            <p className="text-3xl font-bold text-primary mt-2">0</p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardContent className="pt-6">
            <p className="text-sm text-muted">Average Score</p>
            <p className="text-3xl font-bold text-primary mt-2">--</p>
          </CardContent>
        </Card>
      </div>

      {/* Demo Score Display */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-on-dark mb-6">
          Demo: Score Display
        </h2>
        <ScoreDisplay scores={mockScores} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Connect Repository
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Connect your GitHub repository to start analyzing your codebase with AI.
            </p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Start Exam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Begin an interactive exam session to test your understanding of the codebase.
            </p>
          </CardContent>
        </Card>
        <Card variant="dark">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Review your performance scores and get personalized study recommendations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

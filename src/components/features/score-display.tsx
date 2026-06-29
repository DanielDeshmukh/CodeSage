import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ExamScores } from "@/types";

interface ScoreDisplayProps {
  scores: ExamScores;
  showDetails?: boolean;
}

interface ScoreRingProps {
  score: number;
  label: string;
  size?: "sm" | "lg";
}

function ScoreRing({ score, label, size = "lg" }: ScoreRingProps) {
  const percentage = Math.round(score * 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score * circumference);

  const getColor = (score: number) => {
    if (score >= 0.8) return "text-success";
    if (score >= 0.6) return "text-primary";
    if (score >= 0.4) return "text-info";
    return "text-danger";
  };

  const getStrokeColor = (score: number) => {
    if (score >= 0.8) return "#0ecb81";
    if (score >= 0.6) return "#c9a962";
    if (score >= 0.4) return "#3b82f6";
    return "#f6465d";
  };

  return (
    <div className={cn("flex flex-col items-center", size === "sm" ? "gap-1" : "gap-2")}>
      <div className={cn("relative", size === "sm" ? "h-16 w-16" : "h-24 w-24")}>
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#3b3d45"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={getStrokeColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-semibold", getColor(score), size === "sm" ? "text-sm" : "text-xl")}>
            {percentage}%
          </span>
        </div>
      </div>
      <span className={cn("font-medium text-muted", size === "sm" ? "text-xs" : "text-sm")}>
        {label}
      </span>
    </div>
  );
}

export function ScoreDisplay({ scores, showDetails = true }: ScoreDisplayProps) {
  return (
    <Card variant="dark">
      <CardHeader>
        <CardTitle className="text-lg">Performance Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <ScoreRing score={scores.overall} label="Overall" />
          {showDetails && (
            <>
              <div className="h-16 w-px bg-hairline" />
              <div className="flex gap-6">
                <ScoreRing score={scores.architecture} label="Architecture" size="sm" />
                <ScoreRing score={scores.codeDetail} label="Code Detail" size="sm" />
                <ScoreRing score={scores.scalability} label="Scalability" size="sm" />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

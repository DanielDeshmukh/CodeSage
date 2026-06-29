"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps extends HTMLAttributes<HTMLDivElement> {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}

const sizeConfig = {
  sm: { width: 64, strokeWidth: 6, fontSize: "text-sm" },
  md: { width: 96, strokeWidth: 8, fontSize: "text-xl" },
  lg: { width: 128, strokeWidth: 10, fontSize: "text-3xl" },
};

const ScoreGauge = forwardRef<HTMLDivElement, ScoreGaugeProps>(
  (
    {
      score,
      maxScore = 100,
      size = "md",
      showLabel = true,
      label,
      className,
      ...props
    },
    ref
  ) => {
    const { width, strokeWidth, fontSize } = sizeConfig[size];
    const radius = (width - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = (pct: number) => {
      if (pct >= 80) return "#0ecb81"; // success green
      if (pct >= 60) return "#fcd535"; // primary gold
      if (pct >= 40) return "#3b82f6"; // info blue
      return "#f6465d"; // danger red
    };

    const getTextColor = (pct: number) => {
      if (pct >= 80) return "text-success";
      if (pct >= 60) return "text-primary";
      if (pct >= 40) return "text-info";
      return "text-danger";
    };

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center gap-2", className)}
        {...props}
      >
        <div className="relative" style={{ width, height: width }}>
          <svg
            className="h-full w-full -rotate-90"
            viewBox={`0 0 ${width} ${width}`}
          >
            {/* Background circle */}
            <circle
              cx={width / 2}
              cy={width / 2}
              r={radius}
              fill="none"
              stroke="#2b3139"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={width / 2}
              cy={width / 2}
              r={radius}
              fill="none"
              stroke={getColor(percentage)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn("font-bold font-mono", fontSize, getTextColor(percentage))}
            >
              {Math.round(percentage)}
            </span>
          </div>
        </div>
        {showLabel && (
          <span className="text-xs font-medium text-muted">
            {label || "Score"}
          </span>
        )}
      </div>
    );
  }
);

ScoreGauge.displayName = "ScoreGauge";

export { ScoreGauge };

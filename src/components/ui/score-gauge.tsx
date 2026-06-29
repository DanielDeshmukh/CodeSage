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
      if (pct >= 80) return "#00ca8e";
      if (pct >= 60) return "#ffcf25";
      if (pct >= 40) return "#2b89ff";
      return "#e62b1e";
    };

    const getTextColor = (pct: number) => {
      if (pct >= 80) return "text-success";
      if (pct >= 60) return "text-vault";
      if (pct >= 40) return "text-accent-blue";
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
            <circle
              cx={width / 2}
              cy={width / 2}
              r={radius}
              fill="none"
              stroke="#3b3d45"
              strokeWidth={strokeWidth}
            />
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

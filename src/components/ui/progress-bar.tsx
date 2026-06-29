import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  color?: "primary" | "success" | "danger";
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const colorClasses = {
  primary: "bg-primary",
  success: "bg-success",
  danger: "bg-danger",
};

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      size = "md",
      showLabel = false,
      color = "primary",
      className,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const getBarColor = (pct: number) => {
      if (color !== "primary") return colorClasses[color];
      if (pct >= 80) return "bg-success";
      if (pct >= 50) return "bg-primary";
      return "bg-danger";
    };

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        {showLabel && (
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-muted">Progress</span>
            <span className="text-xs font-medium text-on-dark">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          className={cn(
            "overflow-hidden rounded-full bg-surface-elevated",
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              getBarColor(percentage)
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };

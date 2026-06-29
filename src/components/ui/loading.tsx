import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = "md", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-hairline border-t-white",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

const variantClasses = {
  text: "rounded",
  circular: "rounded-full",
  rectangular: "rounded-lg",
};

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = "text", width, height, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-surface-3",
          variantClasses[variant],
          className
        )}
        style={{
          width: width || "100%",
          height: height || (variant === "text" ? "1em" : "100%"),
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

export { Spinner, Skeleton };

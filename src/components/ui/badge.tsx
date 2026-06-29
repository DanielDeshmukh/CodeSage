import { HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        danger: "bg-danger/10 text-danger",
        warning: "bg-primary/10 text-primary",
        info: "bg-info/10 text-info",
        muted: "bg-surface text-muted",
        outline: "border border-hairline text-muted",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={badgeVariants({ variant, size, className })}
        {...props}
      >
        {dot && (
          <span
            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
              variant === "success"
                ? "bg-success"
                : variant === "danger"
                  ? "bg-danger"
                  : variant === "info"
                    ? "bg-info"
                    : "bg-primary"
            }`}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };

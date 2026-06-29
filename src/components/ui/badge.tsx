import { HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-white/10 text-white",
        success: "bg-success/15 text-success",
        danger: "bg-danger/15 text-danger",
        warning: "bg-vault/15 text-vault",
        info: "bg-accent-blue/15 text-accent-blue",
        muted: "bg-surface-3 text-muted",
        outline: "border border-hairline text-muted",
        terraform: "bg-terraform/15 text-terraform",
        vault: "bg-vault/15 text-vault",
        waypoint: "bg-waypoint/15 text-waypoint",
        nomad: "bg-nomad/15 text-nomad",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
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
                    ? "bg-accent-blue"
                    : variant === "warning"
                      ? "bg-vault"
                      : "bg-ink"
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

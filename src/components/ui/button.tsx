import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-dark disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-[#111315] hover:opacity-90 active:opacity-80",
        secondary:
          "bg-surface-elevated text-ink border border-hairline hover:bg-surface-3 active:bg-surface-3",
        tertiary:
          "bg-transparent text-ink hover:bg-surface-card active:bg-surface-card",
        ghost:
          "bg-transparent text-muted hover:text-ink hover:bg-surface-card",
        danger:
          "bg-danger text-white hover:opacity-90 active:opacity-90",
        success:
          "bg-success text-black hover:opacity-90 active:opacity-90",
        terraform:
          "bg-terraform text-white hover:opacity-90 active:opacity-90",
        vault:
          "bg-vault text-black hover:opacity-90 active:opacity-90",
        waypoint:
          "bg-waypoint text-black hover:opacity-90 active:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded",
        md: "h-10 px-5 text-sm rounded",
        lg: "h-12 px-7 text-base rounded",
        icon: "h-10 w-10 rounded",
        "icon-sm": "h-8 w-8 rounded",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

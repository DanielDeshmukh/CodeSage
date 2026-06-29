import { InputHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(
  "flex w-full font-sans transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-dark disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        dark: "bg-surface text-ink border border-hairline rounded",
        ghost: "bg-transparent text-ink border-none",
      },
      inputSize: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "dark",
      inputSize: "md",
    },
  }
);

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, icon, rightElement, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-muted">{icon}</div>
        )}
        <input
          className={inputVariants({
            variant,
            inputSize,
            className: `${icon ? "pl-10" : ""} ${rightElement ? "pr-24" : ""} ${className}`,
          })}
          ref={ref}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2">{rightElement}</div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };

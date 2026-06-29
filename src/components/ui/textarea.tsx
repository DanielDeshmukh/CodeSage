import { TextareaHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const textareaVariants = cva(
  "flex w-full font-body transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-dark disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      variant: {
        dark: "bg-surface text-on-dark border border-hairline rounded-lg",
        light: "bg-canvas-light text-ink border border-hairline-on-light rounded-md",
        ghost: "bg-transparent text-on-dark border-none",
      },
      inputSize: {
        sm: "min-h-[80px] px-3 py-2 text-sm",
        md: "min-h-[120px] px-4 py-3 text-sm",
        lg: "min-h-[200px] px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "dark",
      inputSize: "md",
    },
  }
);

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, inputSize, ...props }, ref) => {
    return (
      <textarea
        className={textareaVariants({ variant, inputSize, className })}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };

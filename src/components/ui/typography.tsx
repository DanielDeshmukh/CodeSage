import { HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const typographyVariants = cva("text-body", {
  variants: {
    variant: {
      h1: "text-5xl font-bold tracking-tight text-on-dark leading-tight",
      h2: "text-4xl font-bold tracking-tight text-on-dark leading-tight",
      h3: "text-3xl font-semibold tracking-tight text-on-dark",
      h4: "text-2xl font-semibold text-on-dark",
      h5: "text-xl font-semibold text-on-dark",
      h6: "text-lg font-semibold text-on-dark",
      "display-lg": "text-5xl font-bold tracking-tight text-on-dark leading-none",
      "display-md": "text-4xl font-semibold tracking-tight text-on-dark leading-tight",
      "display-sm": "text-3xl font-semibold text-on-dark leading-snug",
      "number-display": "text-4xl font-bold text-primary leading-none tracking-tight",
      "number-md": "text-base font-medium text-on-dark",
      "number-sm": "text-sm font-medium text-on-dark",
      body: "text-sm text-body leading-relaxed",
      "body-sm": "text-xs text-body leading-relaxed",
      caption: "text-xs font-medium text-muted leading-snug",
      muted: "text-sm text-muted",
      "muted-sm": "text-xs text-muted",
      link: "text-sm font-medium text-primary hover:text-primary-active transition-colors",
    },
    font: {
      sans: "font-sans",
      mono: "font-mono",
      display: "font-sans",
      number: "font-mono",
    },
  },
  defaultVariants: {
    variant: "body",
    font: "sans",
  },
});

export interface TypographyProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "code" | "pre";
}

const variantToElement: Record<string, string> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  "display-lg": "h1",
  "display-md": "h2",
  "display-sm": "h3",
  "number-display": "span",
  "number-md": "span",
  "number-sm": "span",
  body: "p",
  "body-sm": "p",
  caption: "span",
  muted: "span",
  "muted-sm": "span",
  link: "a",
};

const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, font, as, children, ...props }, ref) => {
    const Component = (as || variantToElement[variant || "body"] || "p") as React.ElementType;
    return (
      <Component
        ref={ref}
        className={typographyVariants({ variant, font, className })}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = "Typography";

export { Typography, typographyVariants };

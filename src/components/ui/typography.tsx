import { HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const typographyVariants = cva("text-ink", {
  variants: {
    variant: {
      h1: "text-3xl font-bold tracking-tight leading-tight sm:text-4xl lg:text-5xl",
      h2: "text-2xl font-bold tracking-tight leading-tight sm:text-3xl lg:text-4xl",
      h3: "text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl",
      h4: "text-lg font-semibold sm:text-xl lg:text-2xl",
      h5: "text-base font-semibold sm:text-lg lg:text-xl",
      h6: "text-sm font-semibold sm:text-base lg:text-lg",
      "display-lg": "text-3xl font-bold tracking-tight leading-none sm:text-4xl lg:text-5xl",
      "display-md": "text-2xl font-semibold tracking-tight leading-tight sm:text-3xl lg:text-4xl",
      "display-sm": "text-xl font-semibold leading-snug sm:text-2xl lg:text-3xl",
      "number-display": "text-2xl font-bold leading-none tracking-tight font-mono sm:text-3xl lg:text-4xl",
      "number-md": "text-base font-medium",
      "number-sm": "text-sm font-medium",
      body: "text-sm text-ink leading-relaxed",
      "body-sm": "text-xs text-ink leading-relaxed",
      caption: "text-xs font-medium text-muted leading-snug",
      muted: "text-sm text-muted",
      "muted-sm": "text-xs text-muted",
      link: "text-sm font-medium text-accent-blue hover:text-white transition-colors",
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

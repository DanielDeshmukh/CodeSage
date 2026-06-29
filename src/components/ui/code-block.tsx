"use client";

import { HTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  maxHeight?: number;
}

const languageColors: Record<string, string> = {
  typescript: "bg-info/20 text-info",
  javascript: "bg-primary/20 text-primary",
  python: "bg-success/20 text-success",
  java: "bg-danger/20 text-danger",
  go: "bg-info/20 text-info",
  rust: "bg-primary/20 text-primary",
  cpp: "bg-info/20 text-info",
  c: "bg-muted/20 text-muted",
  csharp: "bg-success/20 text-success",
  ruby: "bg-danger/20 text-danger",
  php: "bg-info/20 text-info",
  swift: "bg-danger/20 text-danger",
  kotlin: "bg-primary/20 text-primary",
  scala: "bg-danger/20 text-danger",
};

const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    {
      code,
      language = "typescript",
      filename,
      showLineNumbers = true,
      highlightLines = [],
      maxHeight = 400,
      className,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = useState(false);

    const lines = code.split("\n");
    const langColor = languageColors[language] || "bg-muted/20 text-muted";

    const handleCopy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-xl border border-hairline bg-surface",
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
          <div className="flex items-center gap-3">
            {filename && (
              <span className="text-xs font-medium text-on-dark">{filename}</span>
            )}
            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", langColor)}>
              {language}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-on-dark transition-colors"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div
          className="overflow-auto"
          style={{ maxHeight }}
        >
          <pre className="p-4">
            <code className="text-sm font-mono">
              {lines.map((line, i) => {
                const lineNum = i + 1;
                const isHighlighted = highlightLines.includes(lineNum);

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      isHighlighted && "bg-primary/5 -mx-4 px-4 border-l-2 border-primary"
                    )}
                  >
                    {showLineNumbers && (
                      <span className="mr-4 w-8 select-none text-right text-muted/50">
                        {lineNum}
                      </span>
                    )}
                    <span className="flex-1 text-body">{line}</span>
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
    );
  }
);

CodeBlock.displayName = "CodeBlock";

export { CodeBlock };

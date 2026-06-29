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
  typescript: "bg-accent-blue/15 text-accent-blue",
  javascript: "bg-vault/15 text-vault",
  python: "bg-nomad/15 text-nomad",
  java: "bg-consul/15 text-consul",
  go: "bg-waypoint/15 text-waypoint",
  rust: "bg-terraform/15 text-terraform",
  cpp: "bg-accent-blue/15 text-accent-blue",
  c: "bg-muted/15 text-muted",
  csharp: "bg-waypoint/15 text-waypoint",
  ruby: "bg-consul/15 text-consul",
  php: "bg-accent-blue/15 text-accent-blue",
  swift: "bg-consul/15 text-consul",
  kotlin: "bg-terraform/15 text-terraform",
  scala: "bg-consul/15 text-consul",
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
    const langColor = languageColors[language] || "bg-muted/15 text-muted";

    const handleCopy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-lg border border-hairline bg-surface",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
          <div className="flex items-center gap-3">
            {filename && (
              <span className="text-xs font-medium text-ink">{filename}</span>
            )}
            <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium", langColor)}>
              {language}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
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
                      isHighlighted && "bg-white/5 -mx-4 px-4 border-l-2 border-white"
                    )}
                  >
                    {showLineNumbers && (
                      <span className="mr-4 w-8 select-none text-right text-subtle">
                        {lineNum}
                      </span>
                    )}
                    <span className="flex-1 text-ink">{line}</span>
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

"use client";

import Image from "next/image";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas-dark text-ink">
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="w-full max-w-lg rounded-lg border border-hairline bg-surface p-10 text-center">
            <div className="mx-auto mb-6 h-48 w-48 relative">
              <Image
                src="/error-logo.png"
                alt="Sage looking confused and worried"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="mb-4 text-7xl font-bold text-danger">500</div>

            <h1 className="mb-3 text-2xl font-bold text-ink">
              Well, this is embarrassing...
            </h1>

            <p className="mb-2 text-sm text-muted">
              Our Sage tried to compute something and his brain just... stopped.
            </p>

            <p className="mb-4 text-xs text-muted/60">
              {error.message ||
                "Something went wrong on our end. The code monkeys are on it."}
            </p>

            {error.digest && (
              <p className="mb-6 rounded bg-surface-elevated px-3 py-1.5 text-xs text-muted/50">
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={reset}
                className="rounded bg-primary px-8 py-3 text-sm font-semibold text-ink hover:bg-primary-active transition-colors"
              >
                Try again
              </button>
              <Link
                href="/"
                className="rounded border border-hairline px-8 py-3 text-sm font-semibold text-muted hover:bg-surface-elevated transition-colors"
              >
                Emergency exit
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

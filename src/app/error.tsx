"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas-dark text-on-dark">
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="w-full max-w-md rounded-lg border border-hairline bg-surface p-8 text-center">
            <div className="mb-6 text-6xl font-bold text-danger">!</div>
            <h1 className="mb-2 text-xl font-semibold text-on-dark">
              Application Error
            </h1>
            <p className="mb-4 text-sm text-muted">
              {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && (
              <p className="mb-4 text-xs text-muted">
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="rounded bg-primary px-6 py-2 text-sm font-semibold text-ink hover:bg-primary-active"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas-dark p-8">
      <div className="w-full max-w-md rounded-lg border border-hairline bg-surface p-8 text-center">
        <div className="mb-6 text-6xl font-bold text-primary">404</div>
        <h1 className="mb-2 text-xl font-semibold text-on-dark">
          Page not found
        </h1>
        <p className="mb-6 text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded bg-primary px-6 py-2 text-sm font-semibold text-ink hover:bg-primary-active"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

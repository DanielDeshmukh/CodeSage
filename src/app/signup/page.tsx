"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-dark p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-20 w-20 relative">
            <Image
              src="/error-logo.png"
              alt="CodeSage"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-ink">Join CodeSage</h1>
          <p className="mt-2 text-sm text-muted">
            Start mastering your codebase with AI-powered examinations
          </p>
        </div>

        <div className="rounded-lg border border-hairline bg-surface p-8">
          <div className="mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-success">✓</span>
              <p className="text-sm text-muted">
                AI-powered code analysis with 5 specialized models
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-success">✓</span>
              <p className="text-sm text-muted">
                Viva, interview, and code review exam modes
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-success">✓</span>
              <p className="text-sm text-muted">
                Personalized study guides and performance tracking
              </p>
            </div>
          </div>

          <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-primary-active"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign up with GitHub
          </button>

          <div className="mt-6 text-center text-xs text-muted/60">
            By signing up, you agree to our{" "}
            <Link href="#" className="text-primary hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted/60">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

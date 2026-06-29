import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas-dark p-8">
      <div className="w-full max-w-lg rounded-lg border border-hairline bg-surface p-10 text-center">
        <div className="mx-auto mb-6 h-48 w-48 relative">
          <Image
            src="/error-logo.png"
            alt="Sage scratching his head in confusion"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="mb-4 text-7xl font-bold text-primary">404</div>

        <h1 className="mb-3 text-2xl font-bold text-ink">
          Seems like we&apos;re lost...
        </h1>

        <p className="mb-2 text-sm text-muted">
          Even our Sage can&apos;t find this page, and he&apos;s supposed to
          know everything about code.
        </p>

        <p className="mb-8 text-xs text-muted/60">
          This page doesn&apos;t exist, was moved, or never existed in the
          first place. Just like my motivation on Monday mornings.
        </p>

        <Link
          href="/"
          className="inline-block rounded bg-primary px-8 py-3 text-sm font-semibold text-ink hover:bg-primary-active transition-colors"
        >
          Take me somewhere safe
        </Link>
      </div>
    </div>
  );
}

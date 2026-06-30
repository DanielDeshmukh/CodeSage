import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-hairline-soft py-8 px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <span className="text-[12px] text-muted">
          &copy; {new Date().getFullYear()} CodeSage &middot; Built with NVIDIA NIM
        </span>
        <div className="flex gap-6">
          <Link href="/docs" className="text-[12px] text-muted hover:text-muted-strong transition-colors">
            Docs
          </Link>
          <Link href="/privacy" className="text-[12px] text-muted hover:text-muted-strong transition-colors">
            Privacy
          </Link>
          <a href="https://github.com/DanielDeshmukh/CodeSage" target="_blank" rel="noopener noreferrer" className="text-[12px] text-muted hover:text-muted-strong transition-colors">
            GitHub ↗
          </a>
        </div>
      </div>
    </footer>
  );
}

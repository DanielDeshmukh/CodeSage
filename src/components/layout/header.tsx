"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Repositories", href: "/repositories" },
  { label: "Exam", href: "/exam/select" },
  { label: "History", href: "/results" },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-canvas-dark/95 backdrop-blur supports-[backdrop-filter]:bg-canvas-dark/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-ink">CodeSage</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={session ? item.href : "/login"}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-ink",
                  pathname === item.href
                    ? "text-ink"
                    : "text-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  Settings
                </Button>
              </Link>
              <Link href="/repositories/submit">
                <Button variant="primary" size="sm">
                  Add Repository
                </Button>
              </Link>
              <div className="flex items-center gap-3 pl-3 border-l border-hairline">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full"
                  />
                )}
                <span className="text-sm text-muted hidden sm:inline">
                  {session.user?.name || session.user?.login}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

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
    <header className="fixed top-0 z-50 w-full h-[60px] border-b border-hairline-soft bg-canvas-dark/85 backdrop-blur-[12px]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-12">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="6" fill="#0f1117"/>
              <rect x="1" y="1" width="26" height="26" rx="5" stroke="#252830" strokeWidth="1"/>
              <path d="M7 14L11 10L14 13L17 9L21 14" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="14" cy="14" r="2" fill="var(--color-gold)"/>
              <path d="M7 18L10 16L13 18L16 15L21 18" stroke="#3b3d45" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[15px] font-bold text-ink tracking-[-0.3px]">CodeSage</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={session ? item.href : "/login"}
                className={cn(
                  "text-[13px] font-medium transition-colors hover:text-ink tracking-[0.1px]",
                  pathname === item.href ? "text-ink" : "text-muted"
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
                <Button variant="ghost" size="sm" className="text-[13px] font-semibold">
                  Settings
                </Button>
              </Link>
              <Link href="/repositories/submit">
                <Button variant="primary" size="sm" className="text-[13px] font-semibold">
                  Add Repository
                </Button>
              </Link>
              <div className="flex items-center gap-3 pl-3 border-l border-hairline-soft">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full"
                  />
                )}
                <span className="text-[13px] text-muted hidden sm:inline">
                  {session.user?.name || (session.user as any)?.login}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[13px] font-semibold"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[13px] font-semibold">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm" className="text-[13px] font-semibold">
                  Start for free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

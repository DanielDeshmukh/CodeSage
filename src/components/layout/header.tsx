"use client";

import { useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full h-[60px] border-b border-hairline-soft bg-canvas-dark/85 backdrop-blur-[12px]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-12">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="6" fill="#0f1117"/>
              <rect x="1" y="1" width="26" height="26" rx="5" stroke="#252830" strokeWidth="1"/>
              <path d="M7 14L11 10L14 13L17 9L21 14" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="14" cy="14" r="2" fill="var(--color-gold)"/>
              <path d="M7 18L10 16L13 18L16 15L21 18" stroke="#3b3d45" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[15px] font-bold text-ink tracking-[-0.3px]">CodeSage</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={session ? item.href : "/login"}
                  className={cn(
                    "relative px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150",
                    isActive
                      ? "text-ink bg-surface-elevated"
                      : "text-muted hover:text-ink hover:bg-surface-card"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link href="/settings" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-[13px] font-medium px-2.5 gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Settings
                </Button>
              </Link>
              <Link href="/repositories/submit">
                <Button variant="primary" size="sm" className="text-[13px] font-semibold gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Repository
                </Button>
              </Link>

              {/* User profile */}
              <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-hairline-soft">
                {session.user?.image && (
                  <div className="relative">
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 rounded-full ring-2 ring-hairline-soft"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-canvas-dark" />
                  </div>
                )}
                <div className="hidden sm:flex flex-col">
                  <span className="text-[13px] font-medium text-ink leading-tight">
                    {session.user?.name || (session.user as any)?.login}
                  </span>
                  <span className="text-[11px] text-muted leading-tight">Active</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-1 text-muted hover:text-danger"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Sign out"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[13px] font-medium">
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

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-ink hover:bg-surface-card transition-colors ml-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-hairline-soft bg-canvas-dark/95 backdrop-blur-[12px]">
          <nav className="flex flex-col px-6 py-3 gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={session ? item.href : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all",
                    isActive
                      ? "text-ink bg-surface-elevated"
                      : "text-muted hover:text-ink hover:bg-surface-card"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {session && (
              <div className="border-t border-hairline-soft mt-2 pt-2">
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-danger hover:bg-danger/10 transition-all w-full"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

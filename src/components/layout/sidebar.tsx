"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Navigation",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        ),
      },
      {
        label: "Repositories",
        href: "/repositories",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        ),
      },
      {
        label: "Exam Session",
        href: "/exam/select",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        ),
      },
      {
        label: "Score Reports",
        href: "/results",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        ),
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        ),
      },
    ],
  },
];

interface SidebarProps {
  repositoryId?: string;
}

export function Sidebar({ repositoryId }: SidebarProps) {
  const pathname = usePathname() || "/";

  return (
    <aside className="hidden w-60 border-r border-hairline-soft bg-canvas-dark lg:flex flex-col shrink-0">
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-6")}>
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold tracking-[1.2px] uppercase text-muted/60">
                {group.label}
              </span>
            </div>
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const href = repositoryId
                  ? `/repositories/${repositoryId}${item.href === "/" ? "" : item.href}`
                  : item.href;
                const isActive =
                  pathname === href ||
                  (item.href !== "/" && item.href !== "/settings" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "group flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 relative",
                      isActive
                        ? "bg-surface-elevated text-ink"
                        : "text-muted hover:bg-surface-card hover:text-ink"
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />
                    )}
                    <span className={cn(
                      "transition-colors duration-150 shrink-0",
                      isActive ? "text-primary" : "text-muted group-hover:text-ink"
                    )}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom help card */}
      <div className="px-3 pb-4">
        <div className="rounded-lg bg-surface-card border border-hairline-soft p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[40px]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <p className="text-[12px] font-semibold text-ink">Need Help?</p>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Check our documentation for guides and API references.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

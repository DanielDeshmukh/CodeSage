"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

const hideSidebarRoutes = ["/", "/login", "/signup"];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !hideSidebarRoutes.includes(pathname);

  return (
    <div className="flex flex-1 pt-[60px]">
      {showSidebar && <Sidebar />}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

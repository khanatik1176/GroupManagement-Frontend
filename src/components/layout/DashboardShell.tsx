"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Cake,
  CalendarDays,
  LayoutDashboard,
  Menu,
  MessageSquare,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { TakaIcon } from "@/components/ui/TakaIcon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/polls", label: "Polls", icon: BarChart3 },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/expenses", label: "Expenses", icon: TakaIcon },
  { href: "/treats", label: "Treats", icon: Cake },
  { href: "/profile", label: "Profile", icon: User },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = isAdmin
    ? [...navItems, { href: "/users", label: "Users", icon: Users }]
    : navItems;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-theme px-5 py-6">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">
          Nexus Group
        </p>
        <h1 className="mt-2 text-xl font-semibold text-heading">Control Hub</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                  : "text-muted hover:bg-[var(--nav-hover)] hover:text-heading",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-theme bg-sidebar lg:block">
        {sidebar}
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-theme bg-header px-3 py-2.5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-theme bg-elevated p-2 text-body lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <p className="text-xs uppercase tracking-[0.25em] text-accent">
                Nexus Group
              </p>
              <p className="text-sm font-medium text-heading">Control Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-3">{children}</main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[var(--overlay)] lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-theme bg-sidebar lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-2 text-muted"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

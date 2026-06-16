"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((current) => !current)}
        aria-label="Open user menu"
        aria-expanded={open}
        className={cn(
          "rounded-full ring-2 ring-transparent transition focus:outline-none focus:ring-accent/40",
          open && "ring-accent/50",
        )}
      >
        <Avatar name={user.full_name} color={user.avatar_color} size="md" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-56 overflow-hidden rounded-2xl border border-theme bg-elevated shadow-xl"
          >
            <div className="border-b border-theme px-4 py-3">
              <p className="truncate text-sm font-medium text-heading">
                {user.full_name}
              </p>
              <p className="truncate text-xs text-muted">@{user.username}</p>
              <div className="mt-2">
                <RoleBadge role={user.role} />
              </div>
            </div>

            <div className="p-1.5">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-body transition hover:bg-[var(--nav-hover)] hover:text-heading"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[var(--danger)] transition hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-theme bg-elevated text-body transition hover:border-accent/40",
        className,
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-accent" />
      ) : (
        <Moon className="h-4 w-4 text-accent-2" />
      )}
    </motion.button>
  );
}

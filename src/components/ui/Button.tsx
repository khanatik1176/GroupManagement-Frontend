"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "btn-gradient hover:opacity-90",
  secondary:
    "border border-theme bg-elevated text-body hover:border-primary hover:bg-primary-soft",
  danger:
    "border border-red-400/25 bg-red-400/10 text-[var(--danger)] hover:bg-red-400/15",
  ghost: "text-body hover:bg-panel",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className="inline-flex"
    >
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </motion.div>
  );
}

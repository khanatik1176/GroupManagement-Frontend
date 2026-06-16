"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function Card({ children, className, title, description, action }: CardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("glass-card rounded-2xl p-4", className)}
    >
      {(title || description || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-heading">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}

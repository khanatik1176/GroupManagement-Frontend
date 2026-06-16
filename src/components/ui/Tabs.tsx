"use client";

import { cn } from "@/lib/utils";

type Tab = {
  id: string;
  label: string;
};

type TabsProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
};

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-theme bg-panel p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition",
              isActive
                ? "bg-elevated text-heading shadow-sm"
                : "text-muted hover:text-body",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

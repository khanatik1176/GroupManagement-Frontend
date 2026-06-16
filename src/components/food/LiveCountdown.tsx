"use client";

import { Timer } from "lucide-react";
import { useEffect, useState } from "react";

import {
  formatLiveCountdown,
  getElapsedProgress,
  getRemainingMs,
} from "@/lib/foodLive";

export function useLiveClock(tickMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  return now;
}

type LiveCountdownProps = {
  createdAt: string;
  now?: number;
  size?: "sm" | "md";
};

export function LiveCountdown({
  createdAt,
  now: nowProp,
  size = "md",
}: LiveCountdownProps) {
  const tick = useLiveClock();
  const now = nowProp ?? tick;
  const remaining = getRemainingMs(createdAt, now);
  const progress = getElapsedProgress(createdAt, now);
  const urgent = remaining <= 5 * 60 * 1000;

  const dimension = size === "sm" ? 44 : 52;
  const radius = size === "sm" ? 18 : 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (progress / 100);

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative shrink-0 rounded-full ${
          urgent ? "ring-2 ring-[var(--danger)]/40 ring-offset-2 ring-offset-transparent" : ""
        }`}
        style={{ width: dimension, height: dimension }}
      >
        <svg
          className="-rotate-90"
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
        >
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-panel"
          />
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className={urgent ? "text-[var(--danger)]" : "text-primary"}
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-semibold tabular-nums ${
            size === "sm" ? "text-[10px]" : "text-xs"
          } ${urgent ? "text-[var(--danger)]" : "text-heading"}`}
        >
          {formatLiveCountdown(remaining)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Timer className={`h-3.5 w-3.5 ${urgent ? "text-[var(--danger)]" : "text-primary"}`} />
          <span
            className={`text-xs font-medium uppercase tracking-wide ${
              urgent ? "text-[var(--danger)]" : "text-primary"
            }`}
          >
            Live
          </span>
        </div>
        <p className="text-[10px] text-muted">Moves to archive when timer ends</p>
      </div>
    </div>
  );
}

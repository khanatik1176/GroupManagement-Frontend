"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

type FuturisticMapPinProps = {
  isMoving?: boolean;
  className?: string;
};

export function FuturisticMapPin({ isMoving = false, className }: FuturisticMapPinProps) {
  const uid = useId().replace(/:/g, "");
  const bodyGradient = `mapPinBody-${uid}`;
  const sheenGradient = `mapPinSheen-${uid}`;
  const coreGradient = `mapPinCore-${uid}`;
  const glowFilter = `mapPinGlow-${uid}`;

  return (
    <div
      className={cn("relative flex w-[52px] flex-col items-center", className)}
      aria-hidden
    >
      <div
        className={cn(
          "relative transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isMoving ? "-translate-y-4 scale-110" : "-translate-y-1 scale-100",
        )}
      >
        <div
          className={cn(
            "absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-[38%] rounded-full blur-2xl transition-opacity duration-300",
            isMoving ? "bg-primary/55 opacity-100" : "bg-primary/30 opacity-90",
          )}
        />

        <svg
          viewBox="0 0 56 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative h-[4.5rem] w-[3.25rem] drop-shadow-[0_10px_28px_rgba(0,0,0,0.38)]"
        >
          <defs>
            <linearGradient
              id={bodyGradient}
              x1="28"
              y1="4"
              x2="28"
              y2="68"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="var(--primary)" />
              <stop offset="0.55" stopColor="var(--primary-deep)" />
              <stop offset="1" stopColor="var(--secondary)" />
            </linearGradient>
            <linearGradient
              id={sheenGradient}
              x1="18"
              y1="10"
              x2="38"
              y2="34"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" stopOpacity="0.55" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <radialGradient
              id={coreGradient}
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(28 22) rotate(90) scale(14)"
            >
              <stop stopColor="white" stopOpacity="0.95" />
              <stop offset="0.45" stopColor="var(--primary-muted)" stopOpacity="0.85" />
              <stop offset="1" stopColor="var(--secondary)" stopOpacity="0.15" />
            </radialGradient>
            <filter id={glowFilter} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M28 66C28 66 8 38 8 24a20 20 0 1 1 40 0c0 14-20 42-20 42Z"
            fill={`url(#${bodyGradient})`}
            filter={`url(#${glowFilter})`}
          />
          <path
            d="M28 66C28 66 8 38 8 24a20 20 0 1 1 40 0c0 14-20 42-20 42Z"
            fill={`url(#${sheenGradient})`}
          />
          <circle cx="28" cy="24" r="11.5" fill="rgba(255,255,255,0.1)" />
          <circle
            cx="28"
            cy="24"
            r="8.5"
            fill={`url(#${coreGradient})`}
            className={isMoving ? "map-pin-core-active" : "map-pin-core-idle"}
          />
          <circle
            cx="28"
            cy="24"
            r="8.5"
            stroke="white"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <circle cx="25" cy="21" r="2.2" fill="white" fillOpacity="0.8" />
          <path
            d="M28 58 L28 66"
            stroke="var(--primary-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
        </svg>
      </div>

      <div className="relative mt-0.5 flex h-5 w-5 items-center justify-center">
        {!isMoving && (
          <>
            <span className="map-pin-ring" />
            <span className="map-pin-ring map-pin-ring-delay" />
          </>
        )}
        <span
          className={cn(
            "relative z-10 block rounded-full transition-all duration-300",
            isMoving
              ? "h-2 w-2 bg-primary shadow-[0_0_14px_var(--primary)]"
              : "h-1.5 w-1.5 bg-secondary/80 shadow-[0_0_10px_var(--primary)]",
          )}
        />
      </div>
    </div>
  );
}

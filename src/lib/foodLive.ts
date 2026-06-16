/** Live window for new events (2 minutes for testing; was 30 minutes). */
export const LIVE_WINDOW_MS = 2 * 60 * 1000;

export function isLiveItem(createdAt: string, now = Date.now()): boolean {
  return new Date(createdAt).getTime() + LIVE_WINDOW_MS > now;
}

export function getRemainingMs(createdAt: string, now = Date.now()): number {
  return Math.max(
    0,
    new Date(createdAt).getTime() + LIVE_WINDOW_MS - now,
  );
}

export function getElapsedProgress(createdAt: string, now = Date.now()): number {
  const elapsed = now - new Date(createdAt).getTime();
  return Math.min(100, Math.max(0, (elapsed / LIVE_WINDOW_MS) * 100));
}

export function formatLiveCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function partitionByLive<T extends { created_at: string }>(
  items: T[],
  now: number,
): { live: T[]; archived: T[] } {
  const live: T[] = [];
  const archived: T[] = [];

  for (const item of items) {
    if (isLiveItem(item.created_at, now)) {
      live.push(item);
    } else {
      archived.push(item);
    }
  }

  return { live, archived };
}

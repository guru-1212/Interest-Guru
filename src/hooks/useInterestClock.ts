"use client";

import { useEffect, useState } from "react";

/** Ticks on an interval and at local midnight so interest totals refresh (R2). */
export function useInterestClock(intervalMs = 60_000) {
  const [asOf, setAsOf] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setAsOf(new Date());

    const interval = window.setInterval(tick, intervalMs);

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const midnightTimer = window.setTimeout(() => {
      tick();
      window.setInterval(tick, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(midnightTimer);
    };
  }, [intervalMs]);

  return asOf;
}

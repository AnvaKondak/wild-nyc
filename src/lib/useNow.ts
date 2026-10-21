import { useEffect, useState } from 'react';

// Dev only: EXPO_PUBLIC_DEV_CLOCK=09:41 when starting Metro sets today's clock to that
// time, for App Store screenshots of each time of day without a "(preview)" label.
const DEV_CLOCK = __DEV__ ? process.env.EXPO_PUBLIC_DEV_CLOCK : undefined;

function current(): Date {
  const d = new Date();
  const m = DEV_CLOCK?.match(/^(\d{1,2}):(\d{2})$/);
  if (m) d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return d;
}

/** The current time, refreshed every minute so the time-of-day theme stays live. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(current);
  useEffect(() => {
    const id = setInterval(() => setNow(current()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

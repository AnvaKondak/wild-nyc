// Live neighborhood data from the Wild Neighbors API (server/api).
// The only thing ever sent is the neighborhood cell, in the URL.

import type { Species } from '@/content/types';

export type LiveSpecies = {
  id: string;
  /** Sightings in the last 30 days, around the cell. */
  recent: number;
  /** Sightings in the last 365 days. */
  year: number;
  lastSeenOn: string;
  /** Last 12 weeks, oldest first. */
  weekly: number[];
};

export type NeighborhoodReport = {
  cell: string;
  status: 'ready' | 'warming_up';
  updatedAt: string | null;
  species: LiveSpecies[];
  sources: { name: string; url: string }[];
};

/**
 * The API's address. Set EXPO_PUBLIC_API_URL to point at a server. In development it
 * defaults to the local Rails server; in a release build with no URL, live data is
 * simply off and the app uses its bundled content.
 */
export function apiBaseUrl(): string | null {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return typeof __DEV__ !== 'undefined' && __DEV__ ? 'http://localhost:3000' : null;
}

export async function fetchNeighborhood(
  cell: string,
  { baseUrl = apiBaseUrl(), timeoutMs = 8000, fetchImpl = fetch }: { baseUrl?: string | null; timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<NeighborhoodReport | null> {
  if (!baseUrl || !/^[0-9b-hjkmnp-z]{6}$/.test(cell)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // No cookies, no identifiers: just the cell.
    const res = await fetchImpl(`${baseUrl}/v1/neighborhoods/${cell}`, {
      signal: controller.signal,
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as NeighborhoodReport;
  } catch {
    return null; // offline, server down or timed out: fall back quietly
  } finally {
    clearTimeout(timer);
  }
}

export type LiveMap = Map<string, LiveSpecies>;

export function toLiveMap(report: NeighborhoodReport | null | undefined): LiveMap {
  return new Map((report?.species ?? []).map((s) => [s.id, s]));
}

const DAY = 24 * 60 * 60 * 1000;

function daysBetween(fromKey: string, to: Date): number {
  const [y, m, d] = fromKey.split('-').map(Number);
  const from = new Date(y, m - 1, d);
  const today = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((today.getTime() - from.getTime()) / DAY);
}

/**
 * A gentle, number-free line about recent sightings nearby: "Seen nearby this week"
 * or "Seen nearby this month". Older sightings say nothing. Words, not counts.
 */
export function seenLabel(live: LiveSpecies | undefined, today: Date): string | null {
  if (!live || live.year === 0) return null;
  const days = daysBetween(live.lastSeenOn, today);
  if (days <= 7) return 'Seen nearby this week';
  if (days <= 31) return 'Seen nearby this month';
  return null;
}

/** Species who are around this season and have actually been seen nearby this year. */
export function seenThisYear(species: Species[], live: LiveMap): Species[] {
  return species.filter((s) => (live.get(s.id)?.year ?? 0) > 0);
}

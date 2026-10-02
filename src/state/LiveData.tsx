// Keeps the live report for the current neighborhood: from the phone's cache first,
// then the API. If the API can't be reached, screens just see no live data and use
// the bundled content, as before phase 3.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchNeighborhood, toLiveMap, type LiveMap, type NeighborhoodReport } from '@/lib/live';
import { useAppState } from './AppState';
import { currentNeighborhood } from './selectors';

const CACHE_PREFIX = 'wild-neighbors/live/v1/';
const FRESH_MS = 60 * 60 * 1000; // re-ask the API at most hourly per cell
const WARMING_RETRY_MS = 20 * 1000; // first fetch for a cell takes a little while
const WARMING_TRIES = 6;

type Cached = { report: NeighborhoodReport; savedAt: number };
type Value = { report: NeighborhoodReport | null; live: LiveMap };

const LiveDataContext = createContext<Value>({ report: null, live: new Map() });

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const cell = currentNeighborhood(state).cell;
  const [report, setReport] = useState<NeighborhoodReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setReport(null);

    const save = (r: NeighborhoodReport) => {
      const cached: Cached = { report: r, savedAt: Date.now() };
      AsyncStorage.setItem(CACHE_PREFIX + cell, JSON.stringify(cached)).catch(() => {});
    };

    const ask = async (triesLeft: number) => {
      const fresh = await fetchNeighborhood(cell);
      if (cancelled || !fresh) return;
      if (fresh.status === 'ready' || fresh.species.length > 0) {
        setReport(fresh);
        save(fresh);
      }
      if (fresh.status === 'warming_up' && triesLeft > 1) {
        timer = setTimeout(() => ask(triesLeft - 1), WARMING_RETRY_MS);
      }
    };

    (async () => {
      let cached: Cached | null = null;
      try {
        const raw = await AsyncStorage.getItem(CACHE_PREFIX + cell);
        cached = raw ? (JSON.parse(raw) as Cached) : null;
      } catch {
        cached = null;
      }
      if (cancelled) return;
      if (cached) setReport(cached.report);
      if (!cached || Date.now() - cached.savedAt > FRESH_MS) await ask(WARMING_TRIES);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [cell]);

  const value = useMemo(() => ({ report, live: toLiveMap(report) }), [report]);
  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData(): Value {
  return useContext(LiveDataContext);
}

// Current weather for the current neighborhood, refreshed every half hour while the
// app is open. Without it (offline), stories use the everyday moments.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchWeather, type Weather } from '@/lib/weather';
import { useAppState } from './AppState';
import { currentNeighborhood } from './selectors';

const REFRESH_MS = 30 * 60 * 1000;

const WeatherContext = createContext<Weather | null>(null);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const cell = currentNeighborhood(state).cell;
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    let cancelled = false;
    setWeather(null);
    const ask = async () => {
      const w = await fetchWeather(cell);
      if (!cancelled && w) setWeather(w);
    };
    ask();
    const timer = setInterval(ask, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [cell]);

  return <WeatherContext.Provider value={weather}>{children}</WeatherContext.Provider>;
}

export function useWeather(): Weather | null {
  return useContext(WeatherContext);
}

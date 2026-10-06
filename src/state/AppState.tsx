// React wrapper around the reducer: loads from and saves to AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { Neighborhood } from '@/lib/neighborhood';
import { initialState, reducer, type AppState } from './reducer';

const STORAGE_KEY = 'wild-neighbors/state/v1';

type Actions = {
  finishOnboarding: () => void;
  addNeighborhood: (neighborhood: Neighborhood) => void;
  selectNeighborhood: (id: string) => void;
  removeNeighborhood: (id: string) => void;
  toggleNoticed: (speciesId: string, date: string, cell: string) => void;
  toggleKindness: (id: string, seasonKey: string) => void;
  setSound: (on: boolean) => void;
  setNotes: (on: boolean) => void;
};

type Value = { state: AppState; actions: Actions; hydrated: boolean };

const AppStateContext = createContext<Value | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', state: JSON.parse(raw) as AppState });
      })
      .catch(() => {
        // Unreadable storage: start fresh rather than crash.
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const actions = useMemo<Actions>(
    () => ({
      finishOnboarding: () => dispatch({ type: 'finishOnboarding' }),
      addNeighborhood: (neighborhood) => dispatch({ type: 'addNeighborhood', neighborhood }),
      selectNeighborhood: (id) => dispatch({ type: 'selectNeighborhood', id }),
      removeNeighborhood: (id) => dispatch({ type: 'removeNeighborhood', id }),
      toggleNoticed: (speciesId, date, cell) => dispatch({ type: 'toggleNoticed', speciesId, date, cell }),
      toggleKindness: (id, seasonKey) => dispatch({ type: 'toggleKindness', id, seasonKey }),
      setSound: (on) => dispatch({ type: 'setSound', on }),
      setNotes: (on) => dispatch({ type: 'setNotes', on }),
    }),
    [],
  );

  const value = useMemo(() => ({ state, actions, hydrated }), [state, actions, hydrated]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): Value {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}

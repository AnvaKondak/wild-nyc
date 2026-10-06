// All on-device state, as a pure reducer so it can be tested without React.
// Nothing here leaves the phone in phase 2.

import type { Neighborhood } from '@/lib/neighborhood';

export type Noticed = {
  speciesId: string;
  /** Local date, "2026-10-01". */
  date: string;
  /** Neighborhood cell, geohash precision 6. Never anything finer. */
  cell: string;
};

export type AppState = {
  onboarded: boolean;
  neighborhoods: Neighborhood[];
  currentId: string | null;
  noticed: Noticed[];
  /** Checks reset when the season key changes. */
  kindness: { seasonKey: string; done: Record<string, boolean> };
  /** Ambient sound behind the story. Off until the person turns it on. */
  soundOn: boolean;
  /** The one-a-day morning note. Off until the person turns it on. */
  notesOn: boolean;
};

export const initialState: AppState = {
  onboarded: false,
  neighborhoods: [],
  currentId: null,
  noticed: [],
  kindness: { seasonKey: '', done: {} },
  soundOn: false,
  notesOn: false,
};

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'finishOnboarding' }
  | { type: 'addNeighborhood'; neighborhood: Neighborhood }
  | { type: 'selectNeighborhood'; id: string }
  | { type: 'removeNeighborhood'; id: string }
  | { type: 'toggleNoticed'; speciesId: string; date: string; cell: string }
  | { type: 'toggleKindness'; id: string; seasonKey: string }
  | { type: 'setSound'; on: boolean }
  | { type: 'setNotes'; on: boolean };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return { ...initialState, ...action.state };

    case 'finishOnboarding':
      return { ...state, onboarded: true };

    case 'addNeighborhood': {
      // Adding one that's already there just selects it.
      const exists = state.neighborhoods.some((n) => n.id === action.neighborhood.id);
      return {
        ...state,
        neighborhoods: exists ? state.neighborhoods : [...state.neighborhoods, action.neighborhood],
        currentId: action.neighborhood.id,
      };
    }

    case 'selectNeighborhood':
      if (!state.neighborhoods.some((n) => n.id === action.id)) return state;
      return { ...state, currentId: action.id };

    case 'removeNeighborhood': {
      // Always keep at least one.
      if (state.neighborhoods.length <= 1) return state;
      const neighborhoods = state.neighborhoods.filter((n) => n.id !== action.id);
      const currentId = state.currentId === action.id ? neighborhoods[0].id : state.currentId;
      return { ...state, neighborhoods, currentId };
    }

    case 'toggleNoticed': {
      const { speciesId, date, cell } = action;
      const match = (n: Noticed) => n.speciesId === speciesId && n.date === date && n.cell === cell;
      const noticed = state.noticed.some(match)
        ? state.noticed.filter((n) => !match(n))
        : [...state.noticed, { speciesId, date, cell }];
      return { ...state, noticed };
    }

    case 'toggleKindness': {
      // A new season starts with a clean slate.
      const done = state.kindness.seasonKey === action.seasonKey ? state.kindness.done : {};
      return {
        ...state,
        kindness: { seasonKey: action.seasonKey, done: { ...done, [action.id]: !done[action.id] } },
      };
    }

    case 'setSound':
      return { ...state, soundOn: action.on };

    case 'setNotes':
      return { ...state, notesOn: action.on };
  }
}

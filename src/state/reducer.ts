// All on-device state, as a pure reducer so it can be tested without React.
// Nothing here leaves the phone in phase 2.

import type { Neighborhood } from '@/lib/neighborhood';

export type AppState = {
  onboarded: boolean;
  neighborhoods: Neighborhood[];
  currentId: string | null;
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
  | { type: 'replaceHome'; neighborhood: Neighborhood }
  | { type: 'toggleKindness'; id: string; seasonKey: string }
  | { type: 'setSound'; on: boolean }
  | { type: 'setNotes'; on: boolean };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate': {
      // Older saves may still carry "I noticed them" records; that feature is gone.
      const { noticed: _dropped, ...saved } = action.state as AppState & { noticed?: unknown };
      return { ...initialState, ...saved };
    }

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

    case 'replaceHome': {
      // Home moves somewhere else: same name, same first place in the row. If the new
      // spot was already saved under its own name, it folds into Home.
      const at = Math.max(0, state.neighborhoods.findIndex((n) => n.label === 'Home'));
      const next = { ...action.neighborhood, label: 'Home' };
      const others = state.neighborhoods.filter((n, i) => i !== at && n.id !== next.id);
      const neighborhoods = state.neighborhoods.length === 0 ? [next] : [...others.slice(0, at), next, ...others.slice(at)];
      return { ...state, neighborhoods, currentId: next.id };
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

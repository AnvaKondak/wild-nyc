import { DEFAULT_NEIGHBORHOOD, type Neighborhood } from '@/lib/neighborhood';
import type { AppState } from './reducer';

export function currentNeighborhood(state: AppState): Neighborhood {
  return state.neighborhoods.find((n) => n.id === state.currentId) ?? state.neighborhoods[0] ?? DEFAULT_NEIGHBORHOOD;
}

export function isNoticedToday(state: AppState, speciesId: string, today: string, cell: string): boolean {
  return state.noticed.some((n) => n.speciesId === speciesId && n.date === today && n.cell === cell);
}

/** speciesId → the first date they were noticed ("moved in"). */
export function movedIn(state: AppState): Map<string, string> {
  const first = new Map<string, string>();
  for (const n of state.noticed) {
    const prev = first.get(n.speciesId);
    if (!prev || n.date < prev) first.set(n.speciesId, n.date);
  }
  return first;
}

/** Kindness checks for this season only; last season's checks read as not done. */
export function kindnessDone(state: AppState, seasonKey: string): Record<string, boolean> {
  return state.kindness.seasonKey === seasonKey ? state.kindness.done : {};
}

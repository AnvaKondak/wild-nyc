import { DEFAULT_NEIGHBORHOOD, type Neighborhood } from '@/lib/neighborhood';
import type { AppState } from './reducer';

export function currentNeighborhood(state: AppState): Neighborhood {
  return state.neighborhoods.find((n) => n.id === state.currentId) ?? state.neighborhoods[0] ?? DEFAULT_NEIGHBORHOOD;
}

/** Kindness checks for this season only; last season's checks read as not done. */
export function kindnessDone(state: AppState, seasonKey: string): Record<string, boolean> {
  return state.kindness.seasonKey === seasonKey ? state.kindness.done : {};
}

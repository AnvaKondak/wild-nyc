import { dateKey } from '@/lib/time';
import { useAppState } from './AppState';
import { currentNeighborhood, isNoticedToday, movedIn } from './selectors';

/**
 * "I noticed them today" for one species, in the current neighborhood.
 * Records only species + date + neighborhood cell, on the phone.
 */
export function useNoticed(speciesId: string) {
  const { state, actions } = useAppState();
  const cell = currentNeighborhood(state).cell;
  const today = dateKey(new Date());
  return {
    noticedToday: isNoticedToday(state, speciesId, today, cell),
    met: movedIn(state).has(speciesId),
    toggle: () => actions.toggleNoticed(speciesId, today, cell),
  };
}

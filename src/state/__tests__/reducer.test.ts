import type { Neighborhood } from '@/lib/neighborhood';
import { initialState, reducer, type AppState } from '../reducer';
import { currentNeighborhood, kindnessDone } from '../selectors';

const home: Neighborhood = { id: 'home', label: 'Home', cell: 'dr5rsp', kind: 'block' };
const park: Neighborhood = { id: 'park', label: 'Prospect Park', cell: 'dr5rkw', kind: 'park' };

const withBoth = (): AppState =>
  [home, park].reduce((s, n) => reducer(s, { type: 'addNeighborhood', neighborhood: n }), initialState);

describe('neighborhoods', () => {
  it('adds and selects a new neighborhood', () => {
    const s = withBoth();
    expect(s.neighborhoods.map((n) => n.id)).toEqual(['home', 'park']);
    expect(currentNeighborhood(s).id).toBe('park');
  });

  it('does not add the same neighborhood twice', () => {
    const s = reducer(withBoth(), { type: 'addNeighborhood', neighborhood: home });
    expect(s.neighborhoods).toHaveLength(2);
    expect(s.currentId).toBe('home');
  });

  it('removes one and falls back to the first', () => {
    const s = reducer(withBoth(), { type: 'removeNeighborhood', id: 'park' });
    expect(s.neighborhoods.map((n) => n.id)).toEqual(['home']);
    expect(s.currentId).toBe('home');
  });

  it('never removes the last one', () => {
    const one = reducer(initialState, { type: 'addNeighborhood', neighborhood: home });
    expect(reducer(one, { type: 'removeNeighborhood', id: 'home' })).toBe(one);
  });

  it('falls back to a default before anything is picked', () => {
    expect(currentNeighborhood(initialState).id).toBe('default');
  });
});

describe('hydrate', () => {
  it('drops "I noticed them" records from older saves', () => {
    const old = { ...initialState, noticed: [{ speciesId: 'rock-pigeon', date: '2026-10-01', cell: 'dr5rsp' }] } as AppState;
    expect('noticed' in reducer(initialState, { type: 'hydrate', state: old })).toBe(false);
  });
});

describe('kindness', () => {
  it('toggles a check for the season', () => {
    const s = reducer(initialState, { type: 'toggleKindness', id: 'fall-leaves', seasonKey: '2026-fall' });
    expect(kindnessDone(s, '2026-fall')).toEqual({ 'fall-leaves': true });
  });

  it('resets when the season changes', () => {
    const fall = reducer(initialState, { type: 'toggleKindness', id: 'fall-leaves', seasonKey: '2026-fall' });
    expect(kindnessDone(fall, '2026-winter')).toEqual({});
    const winter = reducer(fall, { type: 'toggleKindness', id: 'winter-feeder', seasonKey: '2026-winter' });
    expect(winter.kindness).toEqual({ seasonKey: '2026-winter', done: { 'winter-feeder': true } });
  });

  it('keeps sound off until asked, and remembers the choice', () => {
    expect(initialState.soundOn).toBe(false);
    expect(reducer(initialState, { type: 'setSound', on: true }).soundOn).toBe(true);
    // Saved state from before sound existed still hydrates with sound off.
    const old = { ...initialState } as Partial<typeof initialState>;
    delete old.soundOn;
    expect(reducer(initialState, { type: 'hydrate', state: old as typeof initialState }).soundOn).toBe(false);
  });

  it('keeps the daily note off until asked', () => {
    expect(initialState.notesOn).toBe(false);
    expect(reducer(initialState, { type: 'setNotes', on: true }).notesOn).toBe(true);
  });
});

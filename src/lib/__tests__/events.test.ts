import { events, getSpecies, placeKinds } from '@/content';
import { activeEvent, eventSlide, isHappening } from '../events';
import { seededRandom } from '../random';
import { makeWeather } from '../weather';

const clear = makeWeather(0, 60, 60, 5, 8);

describe('season events', () => {
  it('are real neighbors and well-formed', () => {
    for (const e of events) {
      for (const id of e.species) expect(getSpecies(id)).toBeDefined();
      expect(e.title).not.toMatch(/[.!?]$/);
    }
  });

  it('happen in their window', () => {
    expect(activeEvent(events, new Date(2026, 4, 10), clear)?.id).toMatch(/spring-wave|dawn-chorus-peak|baby-season-pond/);
    expect(activeEvent(events, new Date(2026, 5, 20), clear)?.id).toMatch(/first-fireflies|fledgling-season/);
    expect(activeEvent(events, new Date(2026, 7, 1), clear)).toBeUndefined();
  });

  it('let the weather make the moment', () => {
    const north = { ...clear, tomorrow: { sky: 'clear' as const, lowF: 45, highF: 60, windMph: 14, windFrom: 340 } };
    expect(activeEvent(events, new Date(2026, 9, 6), north)?.id).toBe('big-night');
    const frost = { ...clear, tomorrow: { sky: 'clear' as const, lowF: 30, highF: 45, windMph: 4, windFrom: 180 } };
    expect(activeEvent(events, new Date(2026, 10, 2), frost)?.id).toBe('first-frost');
    expect(activeEvent(events, new Date(2027, 0, 10), makeWeather(73, 28, 22, 5, 8))?.id).toBe('snow-day');
    expect(isHappening(events.find((e) => e.id === 'big-night')!, new Date(2026, 9, 6), clear)).toBe(false);
  });

  it('becomes a story slide with its cast', () => {
    const e = events.find((x) => x.id === 'hawk-migration')!;
    const s = eventSlide(e, new Date(2026, 8, 20), 'near Prospect Park', placeKinds.park.local, seededRandom('e'));
    expect(s.kind).toBe('event');
    expect(s.cast).toHaveLength(4);
    expect(s.body).not.toMatch(/[{}]/);
  });
});

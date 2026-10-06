import { encounters, facts, moments, placeKinds, places, seasonChapters, species } from '@/content';
import { seededRandom } from '../random';
import { arrivingWithin, buildTomorrow } from '../tomorrow';
import type { Forecast } from '../weather';

const prospect = places.find((p) => p.id === 'prospect-park')!;
const place = { cell: 'pp', kind: prospect.kind, placeName: prospect.name, where: placeKinds.park.where, local: prospect.local };
const ctx = { allSpecies: species, moments, facts, chapters: seasonChapters, encounters, season: 'fall' as const, period: 'midday' as const, live: new Map(), weather: [] };
const calm: Forecast = { sky: 'clear', lowF: 50, highF: 62, windMph: 4, windFrom: 180 };
const run = (now: Date, forecast?: Forecast) => buildTomorrow({ places: [place], index: 0, ctx, now, forecast, random: seededRandom('t') });

describe('buildTomorrow', () => {
  it('knows who is due this week', () => {
    expect(arrivingWithin(species.find((s) => s.id === 'dark-eyed-junco')!, new Date(2026, 9, 6))).toBe(4);
    const t = run(new Date(2026, 9, 6), calm);
    expect(t.title).toBe('The juncos are due this week');
    expect(t.body).toMatch(/around October 10/);
  });

  it('reads the wind for migrants', () => {
    const t = run(new Date(2026, 9, 26), { ...calm, windFrom: 330, windMph: 15 });
    expect(t.title).toBe('A north wind tonight');
  });

  it('warns gently about frost, snow, rain and heat', () => {
    expect(run(new Date(2026, 10, 20), { ...calm, lowF: 30 }).title).toBe('Frost tomorrow morning');
    expect(run(new Date(2027, 0, 20), { ...calm, sky: 'snow' }).title).toBe('Snow tomorrow');
    expect(run(new Date(2026, 6, 20), { ...calm, highF: 94 }).title).toBe('A hot one tomorrow');
  });

  it('otherwise names tomorrow morning\'s neighbor', () => {
    const t = run(new Date(2026, 6, 20), calm);
    expect(t.title).toMatch(/^Tomorrow morning: the /);
    expect(t.speciesId).toBeTruthy();
    expect(t.body).not.toMatch(/[{}]/);
  });
});

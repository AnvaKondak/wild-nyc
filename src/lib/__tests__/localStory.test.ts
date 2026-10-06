import { facts, species as allSpecies, stories, speciesFor } from '@/content';
import type { Moment } from '@/content/types';
import { toLiveMap, type LiveSpecies } from '../live';
import { buildLocalStory, fillPlace, pickFact, placePhrase, withLocation } from '../localStory';
import { pick, seededRandom, shuffle } from '../random';

const today = new Date(2026, 9, 4);
const moment = (speciesId: string, n: number, extra: Partial<Moment> = {}): Moment => ({
  id: `${speciesId}-fall-night`,
  speciesId,
  seasons: ['fall'],
  periods: ['night'],
  setting: 'branch',
  kicker: 'Right now',
  variants: Array.from({ length: n }, (_, i) => ({ title: `${speciesId} title ${i}`, body: `${speciesId} body ${i} {place}.` })),
  ...extra,
});
const moments = [moment('raccoon', 3), moment('moths', 3), moment('herring-gull', 2), moment('virginia-opossum', 2), moment('rock-pigeon', 2, { periods: ['dawn'] })];
const liveSpecies = (id: string, recent: number, lastSeenOn = '2026-10-02'): LiveSpecies => ({ id, recent, year: recent * 5, lastSeenOn, weekly: [] });

const base = {
  moments,
  facts,
  slides: stories,
  allSpecies,
  season: 'fall' as const,
  period: 'night' as const,
  placeKind: 'waterfront' as const,
  residents: speciesFor('waterfront', 'fall'),
  placeName: 'Liberty State Park',
  where: 'by the water',
  local: { green: ['the salt marsh'], water: ['the harbor'], landmark: ['the old train terminal'], street: ['Liberty Walk'] },
};

describe('random', () => {
  it('is the same for the same seed and different for another', () => {
    const a = seededRandom('dr5rdc:2026-10-04:night');
    const b = seededRandom('dr5rdc:2026-10-04:night');
    const c = seededRandom('dr5rke:2026-10-04:night');
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    expect([c(), c(), c()]).not.toEqual(xs);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it('pick and shuffle use the generator', () => {
    const r = seededRandom('x');
    expect(['a', 'b', 'c']).toContain(pick(['a', 'b', 'c'], r));
    expect(shuffle([1, 2, 3, 4], seededRandom('y')).sort()).toEqual([1, 2, 3, 4]);
  });
});

describe('placePhrase', () => {
  it('names the place when there is one', () => {
    expect(placePhrase('Liberty State Park', 'by the water')).toBe('near Liberty State Park');
    expect(placePhrase(null, 'on your block')).toBe('on your block');
    expect(fillPlace('Look {place}. Or {where}.', 'near Astoria')).toBe('Look near Astoria. Or near Astoria.');
    const local = { green: ['Astoria Park'], water: ['the East River'], landmark: ['the Hell Gate Bridge'], street: ['Ditmars Boulevard'] };
    expect(fillPlace('Down {street}, past {green}, under {landmark}, to {water}.', 'near Astoria', local)).toBe(
      'Down Ditmars Boulevard, past Astoria Park, under the Hell Gate Bridge, to the East River.',
    );
  });
});

describe('pickFact', () => {
  const tagged = [
    { speciesId: 'x', text: 'any' },
    { speciesId: 'x', text: 'fall', seasons: ['fall' as const] },
    { speciesId: 'x', text: 'fall night', seasons: ['fall' as const], periods: ['night' as const] },
    { speciesId: 'x', text: 'spring', seasons: ['spring' as const] },
  ];

  it('never shows a fact tagged for another season or time', () => {
    for (let i = 0; i < 30; i++) expect(pickFact(tagged, 'x', 'fall', 'dawn', seededRandom(`f${i}`))).not.toMatch(/spring|night/);
  });

  it('prefers the most specific fact', () => {
    const picks = Array.from({ length: 40 }, (_, i) => pickFact(tagged, 'x', 'fall', 'night', seededRandom(`g${i}`)));
    expect(picks.filter((p) => p === 'fall night').length).toBeGreaterThan(20);
  });

  it('every story slide about a species carries a fact', () => {
    const story = buildLocalStory({ ...base, live: new Map(), seed: 'facts' });
    for (const s of story.filter((x) => x.speciesId)) expect(s.fact).toBeTruthy();
  });
});

describe('withLocation', () => {
  it('adds a place that fits the setting when the title has none', () => {
    const r = seededRandom('x');
    expect(withLocation('A crow is keeping an eye on things', 'rooftop', 'block', r)).toMatch(/ (along \{street\}|near \{landmark\}|on the block)$/);
    expect(withLocation('A gull is gliding', 'water', 'waterfront', r)).toMatch(/ (by \{water\}|out on \{water\}|at the waterfront)$/);
    expect(withLocation('A gull is gliding over {water}', 'water', 'waterfront', r)).toBe('A gull is gliding over {water}');
  });

  it('gives every story title a place', () => {
    const story = buildLocalStory({ ...base, live: new Map(), seed: 'loc' });
    const names = ['the salt marsh', 'the harbor', 'the old train terminal', 'Liberty Walk', 'at the waterfront', 'near Liberty State Park'];
    for (const s of story.filter((x) => x.id.includes('-fall-night'))) {
      expect(names.some((n) => s.title.includes(n))).toBe(true);
    }
  });
});

describe('buildLocalStory', () => {
  it('features species seen nearby lately first, with the place named', () => {
    const live = toLiveMap({ cell: 'x', status: 'ready', updatedAt: null, sources: [], species: [liveSpecies('herring-gull', 9), liveSpecies('moths', 21)] });
    const story = buildLocalStory({ ...base, live, seed: 's1' });
    const scenes = story.filter((s) => s.kind === 'scene');
    expect(scenes.slice(0, 2).map((s) => s.speciesId)).toEqual(['moths', 'herring-gull']);
    expect(scenes[0].body).toContain('near Liberty State Park');
    expect(scenes[0].setting).toBe('branch');
  });

  it('names local spots in a named neighborhood', () => {
    const localMoment: Moment = { ...moment('raccoon', 1), id: 'raccoon-local', variants: [
      { title: 'Plain', body: 'A raccoon is out {place}.' },
      { title: 'Local', body: 'A raccoon is heading for {green}.' },
    ] };
    const picks = Array.from({ length: 40 }, (_, i) => buildLocalStory({ ...base, moments: [localMoment], residents: speciesFor('waterfront', 'fall').filter((s) => s.id === 'raccoon'), live: new Map(), seed: `n${i}` })[0]);
    const localShare = picks.filter((s) => s.body.includes('the salt marsh')).length / picks.length;
    expect(localShare).toBeGreaterThan(0.5);
  });

  it('only uses moments for this time of day', () => {
    const story = buildLocalStory({ ...base, live: new Map(), seed: 's1' });
    expect(story.some((s) => s.speciesId === 'rock-pigeon' && s.id.startsWith('rock-pigeon-fall-night'))).toBe(false);
  });

  it('is stable for a seed and varies across seeds', () => {
    const run = (seed: string) => buildLocalStory({ ...base, live: new Map(), seed }).map((s) => s.id).join('|');
    expect(run('dr5rdc:2026-10-04:night')).toBe(run('dr5rdc:2026-10-04:night'));
    const variety = new Set(Array.from({ length: 12 }, (_, i) => run(`seed-${i}`)));
    expect(variety.size).toBeGreaterThan(3);
  });

  it('is about one species per slide, never a list', () => {
    const live = toLiveMap({ cell: 'x', status: 'ready', updatedAt: null, sources: [], species: [liveSpecies('herring-gull', 9), liveSpecies('moths', 21), liveSpecies('raccoon', 3)] });
    const story = buildLocalStory({ ...base, live, seed: 's2' });
    expect(story.every((s) => s.speciesId || s.link === 'kindness')).toBe(true);
  });

  it('tops up with generic slides and ends with the chapters', () => {
    const story = buildLocalStory({ ...base, moments: [], live: new Map(), seed: 's' });
    expect(story.filter((s) => (s.kind ?? 'scene') === 'scene').length).toBeGreaterThanOrEqual(3);
    expect(story.at(-2)?.kind).toBe('arriving');
    expect(story.at(-1)?.kind).toBe('goodbye');
    expect(story.every((s) => !s.body.includes('{place}') && !s.body.includes('{where}'))).toBe(true);
  });
});

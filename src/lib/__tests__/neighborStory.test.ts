import { facts, getSpecies, moments, placeKinds, places, seasonChapters, species } from '@/content';
import type { Period, PlaceKind, Season } from '@/content/types';
import { toLiveMap, type LiveSpecies } from '../live';
import { aroundSlide, buildArc, leadWeight, pickAround, pickLead, poolFor, type StoryPlace, type StoryContext } from '../neighborStory';
import { seededRandom } from '../random';

const lsp = places.find((p) => p.id === 'liberty-state-park')!;
const prospect = places.find((p) => p.id === 'prospect-park')!;
const placeOf = (p: typeof lsp): StoryPlace => ({ cell: p.id, kind: p.kind, placeName: p.name, where: placeKinds[p.kind].where, local: p.local });
const unnamed = (kind: PlaceKind, cell = `x-${kind}`): StoryPlace => ({ cell, kind, placeName: null, where: placeKinds[kind].where, local: placeKinds[kind].local });
const ctxOf = (season: Season, period: Period, extra: Partial<StoryContext> = {}): StoryContext => ({
  allSpecies: species,
  moments,
  facts,
  chapters: seasonChapters,
  season,
  period,
  live: new Map(),
  weather: [],
  ...extra,
});
const seen = (id: string, recent: number): LiveSpecies => ({ id, recent, year: recent * 5, lastSeenOn: '2026-10-02', weekly: [] });
const DAYS = Array.from({ length: 30 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);

describe('pickLead', () => {
  it('always finds a lead, in every kind of place, season and time of day', () => {
    for (const kind of ['block', 'park', 'waterfront'] as const)
      for (const season of ['spring', 'summer', 'fall', 'winter'] as const)
        for (const period of ['dawn', 'midday', 'dusk', 'night'] as const) {
          expect([kind, season, period, pickLead([unnamed(kind)], 0, ctxOf(season, period), '2026-10-05', '2026-10-04')?.id]).toEqual([kind, season, period, expect.any(String)]);
        }
  });

  it('holds still for the same day and time, and changes through the day', () => {
    const p = placeOf(lsp);
    const a = pickLead([p], 0, ctxOf('fall', 'dawn'), '2026-10-05', '2026-10-04');
    expect(pickLead([p], 0, ctxOf('fall', 'dawn'), '2026-10-05', '2026-10-04')?.id).toBe(a?.id);
    const day = (['dawn', 'midday', 'dusk', 'night'] as const).map((period) => pickLead([p], 0, ctxOf('fall', period), '2026-10-05', '2026-10-04')?.id);
    expect(new Set(day).size).toBe(4);
  });

  it('rarely repeats yesterday\'s lead at the same time', () => {
    const p = placeOf(prospect);
    const lead = (i: number) => pickLead([p], 0, ctxOf('fall', 'midday'), DAYS[i], i > 0 ? DAYS[i - 1] : '2026-09-30')?.id;
    let repeats = 0;
    for (let i = 1; i < DAYS.length; i++) if (lead(i) === lead(i - 1)) repeats++;
    expect(repeats).toBeLessThanOrEqual(3);
  });

  it('gives saved neighborhoods different leads on the same day', () => {
    const home = unnamed('park', 'home');
    const park = placeOf(prospect);
    for (const d of DAYS) {
      const first = pickLead([home, park], 0, ctxOf('fall', 'dawn'), d, 'y');
      const second = pickLead([home, park], 1, ctxOf('fall', 'dawn'), d, 'y');
      expect(second?.id).not.toBe(first?.id);
    }
  });

  it('makes neighborhoods feel like themselves: locals lead far more than the everywhere crowd', () => {
    const leads = DAYS.map((d) => pickLead([placeOf(lsp)], 0, ctxOf('fall', 'midday'), d, 'y')!);
    const everywhere = leads.filter((s) => Object.keys(s.spots).length >= 3).length;
    expect(everywhere / leads.length).toBeLessThan(0.4);
    expect(leads.some((s) => s.homeScene === 'waterfront')).toBe(true);
  });

  it('weighs in live sightings and the weather', () => {
    const ctx = ctxOf('fall', 'midday');
    const gull = getSpecies('herring-gull')!;
    expect(leadWeight(gull, 'waterfront', { ...ctx, live: toLiveMap({ cell: 'x', status: 'ready', updatedAt: null, sources: [], species: [seen('herring-gull', 8)] }) })).toBeGreaterThan(leadWeight(gull, 'waterfront', ctx));
    expect(leadWeight(gull, 'waterfront', { ...ctx, weather: ['rain'] })).toBeGreaterThan(leadWeight(gull, 'waterfront', ctx));
  });

  it('follows the night crowd after dark', () => {
    const night = ctxOf('fall', 'night');
    const raccoon = getSpecies('raccoon')!;
    const jay = getSpecies('blue-jay')!;
    expect(leadWeight(raccoon, 'park', night) / leadWeight(jay, 'park', night)).toBeGreaterThan(
      leadWeight(raccoon, 'park', ctxOf('fall', 'midday')) / leadWeight(jay, 'park', ctxOf('fall', 'midday')),
    );
  });

  it('only lets rare visitors lead where they have been seen', () => {
    const ctx = ctxOf('fall', 'dawn');
    expect(poolFor('park', ctx).some((s) => s.id === 'white-tailed-deer')).toBe(false);
    const live = toLiveMap({ cell: 'x', status: 'ready', updatedAt: null, sources: [], species: [seen('white-tailed-deer', 2)] });
    expect(poolFor('park', { ...ctx, live }).some((s) => s.id === 'white-tailed-deer')).toBe(true);
  });
});

describe('buildArc', () => {
  const ctx = ctxOf('fall', 'midday');
  const squirrel = getSpecies('eastern-gray-squirrel')!;

  it('tells one neighbor\'s story in three to five slides, all about them', () => {
    const arc = buildArc(squirrel, placeOf(prospect), ctx, 'lead', seededRandom('a'));
    expect(arc.length).toBeGreaterThanOrEqual(3);
    expect(arc.length).toBeLessThanOrEqual(5);
    expect(arc.every((s) => s.speciesId === squirrel.id)).toBe(true);
    expect(arc.at(-1)!.kicker).toMatch(/^Be a good neighbor near Prospect Park/);
    expect(arc.some((s) => s.title === 'The acorn race')).toBe(true); // who they run into this fall
    expect(new Set(arc.map((s) => s.id)).size).toBe(arc.length);
    for (const s of arc) expect(s.title + s.body).not.toMatch(/[{}]/);
  });

  it('opens with the weather when there is a moment for it', () => {
    const arc = buildArc(squirrel, placeOf(prospect), { ...ctx, weather: ['rain'] }, 'lead', seededRandom('b'));
    expect(arc[0].kicker).toBe('In the rain');
  });

  it('keeps a visit short', () => {
    const arc = buildArc(squirrel, unnamed('block'), ctx, 'visit', seededRandom('c'));
    expect(arc).toHaveLength(3);
  });

  it('has a story for every lead, everywhere, all year', () => {
    for (const kind of ['block', 'park', 'waterfront'] as const)
      for (const season of ['spring', 'summer', 'fall', 'winter'] as const)
        for (const period of ['dawn', 'midday', 'dusk', 'night'] as const) {
          const c = ctxOf(season, period);
          const lead = pickLead([unnamed(kind)], 0, c, '2026-10-05', '2026-10-04')!;
          expect(buildArc(lead, unnamed(kind), c, 'lead', seededRandom('d')).length).toBeGreaterThanOrEqual(3);
        }
  });
});

describe('Also around today', () => {
  it('offers a handful of others, seen lately first, never the lead twice', () => {
    const ctx = ctxOf('fall', 'midday', { live: toLiveMap({ cell: 'x', status: 'ready', updatedAt: null, sources: [], species: [seen('brant', 9)] }) });
    const p = placeOf(lsp);
    const lead = getSpecies('herring-gull')!;
    const around = pickAround(p, ctx, lead, 'seed');
    expect(around.length).toBeGreaterThanOrEqual(4);
    expect(around[0].id).toBe('brant');
    expect(around.some((s) => s.id === lead.id)).toBe(false);
    const slide = aroundSlide(p, ctx, around, lead);
    expect(slide.kind).toBe('around');
    expect(slide.aroundSpecies![0]).toBe(lead.id);
  });

  it('lists who just arrived first', () => {
    const ctx = ctxOf('fall', 'midday');
    const p = placeOf(prospect);
    const wtsp = getSpecies('white-throated-sparrow')!;
    const around = pickAround(p, ctx, getSpecies('mallard'), 'seed', [wtsp]);
    expect(around[0].id).toBe('white-throated-sparrow');
    expect(aroundSlide(p, ctx, around, getSpecies('mallard'), [wtsp]).arrivedSpecies).toEqual(['white-throated-sparrow']);
  });
});

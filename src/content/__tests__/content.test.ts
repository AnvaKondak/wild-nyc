// Guards the bundled content: every reference points somewhere real, and every
// season the app can land in has a full set.
import { fillPlace } from '@/lib/localStory';
import {
  getSpecies,
  hurtAnimalGuide,
  kindnesses,
  kindnessesFor,
  facts,
  moments,
  photoCredit,
  photoCreditsFor,
  speciesPhotos,
  speciesPhoto,
  placeKinds,
  places,
  species,
  seasonChapters,
  stories,
  type Period,
  type PlaceKind,
  type Season,
} from '..';

const READY_SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];
const PERIODS: Period[] = ['dawn', 'midday', 'dusk', 'night'];
const KINDS = Object.keys(placeKinds) as PlaceKind[];

describe('species', () => {
  it('have unique ids', () => {
    expect(new Set(species.map((s) => s.id)).size).toBe(species.length);
  });

  it.each(species.map((s) => [s.id, s] as const))('%s has a full profile', (_id, s) => {
    expect(s.personality.traits).toHaveLength(3);
    for (const season of ['spring', 'summer', 'fall', 'winter'] as const) {
      expect(s.rightNow[season].length).toBeGreaterThan(10);
    }
    expect(s.seasons.length).toBeGreaterThan(0);
    expect(s.funFact.title && s.funFact.body && s.kindness.title && s.kindness.body).toBeTruthy();
  });

});

describe('moments', () => {
  const SETTINGS = ['branch', 'trunk', 'wire', 'ledge', 'rooftop', 'streetlight', 'lawn', 'sidewalk', 'hedge', 'flowers', 'water', 'shore', 'pier', 'sky', 'night-sky', 'web', 'trashcan', 'fence', 'reeds', 'den'];

  it('have unique ids, real species, known settings and at least one variant', () => {
    expect(new Set(moments.map((m) => m.id)).size).toBe(moments.length);
    for (const m of moments) {
      expect(getSpecies(m.speciesId)).toBeDefined();
      expect(SETTINGS).toContain(m.setting);
      expect(m.variants.length).toBeGreaterThan(0);
      expect(m.seasons.length).toBeGreaterThan(0);
      expect(m.periods.length).toBeGreaterThan(0);
    }
  });

  it('only happen in seasons the species is around', () => {
    for (const m of moments) {
      const s = getSpecies(m.speciesId)!;
      for (const season of m.seasons) expect(s.seasons).toContain(season);
    }
  });

  it('put {place} where both "near Astoria" and "on your block" read well', () => {
    for (const m of moments) for (const v of m.variants) {
      expect(v.title + ' ' + v.body).not.toMatch(/\b(over|at|by|in|to|of|from|on|into|around|near|past|through) \{place\}/i);
    }
  });

  it('have titles that can take a place on the end (no ?, ! or . endings)', () => {
    for (const m of moments) for (const v of m.variants) expect(v.title).not.toMatch(/[?!.)]\s*$/);
  });

  it('only use known placeholders', () => {
    for (const m of moments) for (const v of m.variants) {
      expect((v.title + v.body).replace(/\{(place|green|water|landmark|street)\}/g, '')).not.toMatch(/[{}]/);
    }
  });

  it('fill in completely for every neighborhood and every unnamed kind of place', () => {
    const locals = [...places.map((p) => p.local), ...KINDS.map((k) => placeKinds[k].local)];
    for (const local of locals) {
      for (const names of Object.values(local)) {
        expect(names.length).toBeGreaterThan(0);
        for (const n of names) expect(n.length).toBeGreaterThan(2);
      }
      for (const m of moments) for (const v of m.variants) {
        expect(fillPlace(v.title + ' ' + v.body, 'near Astoria', local)).not.toMatch(/[{}]/);
      }
    }
  });

  it.each(READY_SEASONS)('%s has several species with moments at every time of day', (season) => {
    for (const period of PERIODS) {
      const speciesWithMoments = new Set(moments.filter((m) => m.seasons.includes(season) && m.periods.includes(period)).map((m) => m.speciesId));
      expect(speciesWithMoments.size).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('facts', () => {
  it('every species has at least three, for real species, in seasons they are around', () => {
    for (const s of species) expect(facts.filter((f) => f.speciesId === s.id).length).toBeGreaterThanOrEqual(3);
    for (const f of facts) {
      const s = getSpecies(f.speciesId);
      expect(s).toBeDefined();
      for (const season of f.seasons ?? []) expect(s!.seasons).toContain(season);
    }
  });

  it('every species has a fact for every season and time they show up in', () => {
    for (const s of species) for (const season of s.seasons) for (const period of PERIODS) {
      const fits = facts.some((f) => f.speciesId === s.id && (!f.seasons || f.seasons.includes(season)) && (!f.periods || f.periods.includes(period)));
      expect(fits).toBe(true);
    }
  });
});

describe('photos', () => {
  it('every species has a bundled photo with a license we can ship and a credit', () => {
    for (const s of species) {
      expect(speciesPhoto(s.id)).toBeDefined();
      const credit = photoCredit(s.id)!;
      expect(['CC0', 'CC BY', 'CC BY-SA']).toContain(credit.license);
      expect(credit.attribution.length).toBeGreaterThan(5);
      expect(credit.source).toMatch(/^https:\/\/www\.inaturalist\.org\/photos\/\d+$/);
    }
  });

  it('every extra photo has a license we can ship and a credit, and none repeats', () => {
    for (const s of species) {
      const credits = photoCreditsFor(s.id);
      expect(speciesPhotos(s.id)).toHaveLength(credits.length);
      expect(new Set(credits.map((c) => c.source)).size).toBe(credits.length);
      for (const c of credits) expect(['CC0', 'CC BY', 'CC BY-SA']).toContain(c.license);
    }
  });
});

describe('copy', () => {
  it('uses "who", never "that", for animals', () => {
    // Loose check for the "animals are someone" rule across all content.
    const text = JSON.stringify([species, stories, kindnesses, moments]);
    expect(text).not.toMatch(/\b(birds?|animals?|squirrels?|insects?|bugs?|moths?|butterfl(y|ies)|babies|one) that\b/i);
  });

  it('calls animals "they", never "it"', () => {
    // Loose check: "its" + a body part or family, "it" + something only an animal does,
    // and "It's a heron" style introductions.
    const text = JSON.stringify([species, stories, kindnesses, moments, facts, seasonChapters, hurtAnimalGuide]);
    expect(text).not.toMatch(/\bits (feathers|wings?|head|nest|own nest|beak|tail|eyes|legs|feet|fur|parents?|babies|chicks|mate|young|way across)\b/i);
    expect(text).not.toMatch(/\bit (may dig|turns to|gives up|just looks|needs help|flies|sings|eats|hops|swims)\b/i);
    expect(text).not.toMatch(/\bIt's an? (heron|catbird|mockingbird|downy|blue jay|hermit thrush|robin|cardinal|sparrow|gull|crow|pigeon|squirrel|raccoon)\b/);
  });
});

describe('stories', () => {
  it('have unique ids and point at real species', () => {
    expect(new Set(stories.map((s) => s.id)).size).toBe(stories.length);
    for (const s of stories) {
      if (s.speciesId) expect(getSpecies(s.speciesId)).toBeDefined();
      if (!s.speciesId) expect(s.link).toBe('kindness');
    }
  });

  it('only use {where} as a placeholder', () => {
    for (const s of stories) {
      expect(s.body.replace(/\{where\}/g, '')).not.toMatch(/[{}]/);
    }
  });

  it.each(READY_SEASONS)('%s has journeys in and out, for Chapters', (season) => {
    expect(stories.some((s) => s.season === season && s.kind === 'arriving')).toBe(true);
    expect(stories.some((s) => s.season === season && s.kind === 'goodbye')).toBe(true);
  });
});

describe('kindness', () => {
  it.each(READY_SEASONS)('%s has six kindnesses', (season) => {
    expect(kindnessesFor(season)).toHaveLength(6);
  });
});

describe('places', () => {
  it('use real kinds, and every kind has residents', () => {
    for (const p of places) expect(KINDS).toContain(p.kind);
    for (const kind of KINDS) expect(species.some((s) => s.spots[kind])).toBe(true);
  });

  it('every species lives somewhere, including its home scene', () => {
    for (const s of species) expect(s.spots[s.homeScene]).toBeDefined();
  });

  it('are all in NYC or Jersey City', () => {
    for (const p of places) {
      expect(p.lat).toBeGreaterThan(40.4);
      expect(p.lat).toBeLessThan(41);
      expect(p.lng).toBeGreaterThan(-74.3);
      expect(p.lng).toBeLessThan(-73.6);
    }
  });
});

describe('hurt animal guide', () => {
  it('has steps and rehab contacts', () => {
    expect(hurtAnimalGuide.steps.length).toBeGreaterThan(0);
    expect(hurtAnimalGuide.rehabs.length).toBeGreaterThan(0);
  });
});

describe('season chapters', () => {
  it('cover every season, with stories about neighbors together', () => {
    expect(seasonChapters.map((c) => c.season).sort()).toEqual(['fall', 'spring', 'summer', 'winter']);
    for (const c of seasonChapters) {
      expect(c.stories.length).toBeGreaterThanOrEqual(5);
      for (const st of c.stories) {
        expect(st.species.length).toBeGreaterThanOrEqual(2);
        for (const id of st.species) expect(getSpecies(id)).toBeDefined();
      }
    }
  });
});

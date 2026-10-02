// Guards the bundled content: every reference points somewhere real, and every
// season the app can land in has a full set.
import { buildStory } from '@/lib/story';
import {
  getSpecies,
  hurtAnimalGuide,
  kindnessesFor,
  placeKinds,
  places,
  species,
  stories,
  type Period,
  type PlaceKind,
  type Season,
} from '..';

// Seasons with finished content. Step 6 adds the rest.
const READY_SEASONS: Season[] = ['fall'];
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

  it('use "who", never "that", when referring to animals', () => {
    // Loose check for the copy rule: no "a bird that", "animals that", etc.
    const text = JSON.stringify(species);
    expect(text).not.toMatch(/\b(bird|birds|animal|animals|squirrel|squirrels|one) that\b/i);
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

  it.each(READY_SEASONS)('%s has scenes for every period and both chapter slides, in every kind of place', (season) => {
    for (const period of PERIODS) {
      for (const kind of KINDS) {
        const story = buildStory(stories, { season, period, placeKind: kind, where: placeKinds[kind].where });
        const scenes = story.filter((s) => (s.kind ?? 'scene') === 'scene');
        expect(scenes.length).toBeGreaterThanOrEqual(3);
        expect(story.at(-2)?.kind).toBe('arriving');
        expect(story.at(-1)?.kind).toBe('goodbye');
        for (const s of story) expect(s.body).not.toContain('{where}');
      }
    }
  });
});

describe('kindness', () => {
  it.each(READY_SEASONS)('%s has six kindnesses', (season) => {
    expect(kindnessesFor(season)).toHaveLength(6);
  });
});

describe('places', () => {
  it('reference real species and kinds', () => {
    for (const info of Object.values(placeKinds)) {
      for (const id of info.species) expect(getSpecies(id)).toBeDefined();
    }
    for (const p of places) expect(KINDS).toContain(p.kind);
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

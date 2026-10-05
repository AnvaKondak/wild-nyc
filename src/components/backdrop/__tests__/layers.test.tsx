import { buildLayers } from '../layers';

const SETTINGS = ['branch', 'trunk', 'den', 'wire', 'ledge', 'rooftop', 'streetlight', 'lawn', 'sidewalk', 'hedge', 'flowers', 'water', 'shore', 'pier', 'reeds', 'fence', 'trashcan', 'web', 'sky', 'night-sky'] as const;
const PERIODS = ['dawn', 'midday', 'dusk', 'night'] as const;
const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const;
const KINDS = ['block', 'park', 'waterfront'] as const;

describe('buildLayers', () => {
  it('builds every setting x time x season x place x variant, with unique layer ids', () => {
    for (const setting of SETTINGS) for (const period of PERIODS) for (const season of SEASONS) for (const placeKind of KINDS) for (const variant of [0, 1, 2]) {
      const layers = buildLayers({ w: 390, h: 760, setting, period, season, placeKind, placeId: 'liberty-state-park', variant, moonLit: 0.3 });
      const ids = layers.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(layers.length).toBeGreaterThan(2);
    }
  });

  it('gives each season its own particles', () => {
    const ids = (season: (typeof SEASONS)[number], period: (typeof PERIODS)[number] = 'midday') =>
      buildLayers({ w: 390, h: 760, setting: 'sky', period, season, placeKind: 'block', variant: 0, moonLit: 1 }).map((l) => l.id);
    expect(ids('fall')).toContain('leaves-near');
    expect(ids('winter')).toContain('snow-near');
    expect(ids('spring')).toContain('petals-near');
    expect(ids('summer', 'night')).toContain('fireflies-a');
  });

  it('shows the sky the time of day calls for', () => {
    const ids = (period: (typeof PERIODS)[number], placeKind: (typeof KINDS)[number] = 'block') =>
      buildLayers({ w: 390, h: 760, setting: 'sky', period, season: 'fall', placeKind, variant: 0, moonLit: 0.5 }).map((l) => l.id);
    expect(ids('night')).toEqual(expect.arrayContaining(['moon', 'stars-a', 'shooting-star', 'windows-a']));
    expect(ids('midday')).toEqual(expect.arrayContaining(['sun', 'sun-rays', 'clouds-near', 'flock']));
    expect(ids('dawn')).toContain('low-sun');
    expect(ids('midday', 'waterfront')).toEqual(expect.arrayContaining(['geese', 'boat', 'harbor']));
  });
});

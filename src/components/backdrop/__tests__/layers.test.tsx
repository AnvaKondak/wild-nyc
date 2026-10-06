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
    expect(ids('fall').some((id) => id.startsWith('leaves'))).toBe(false);
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

  it('shows the weather, and hides the sun under a gray sky', () => {
    const ids = (sky: Parameters<typeof buildLayers>[0]['sky'], weather: Parameters<typeof buildLayers>[0]['weather'] = [], season: (typeof SEASONS)[number] = 'winter') =>
      buildLayers({ w: 390, h: 760, setting: 'lawn', period: 'midday', season, placeKind: 'park', variant: 1, moonLit: 1, sky, weather }).map((l) => l.id);
    expect(ids('rain', ['rain'], 'spring')).toEqual(expect.arrayContaining(['rain-near', 'overcast']));
    expect(ids('rain', ['rain'], 'spring')).not.toContain('sun');
    expect(ids('rain', ['rain'], 'spring')).not.toContain('petals-near');
    expect(ids('snow', ['snow'])).toContain('snowfall-near');
    expect(ids('clear', [])).not.toContain('snow-near'); // no snow on a clear winter day
    expect(ids(undefined)).toContain('snow-near'); // weather unknown: the season's look
    expect(ids('fog', ['fog'])).toContain('fog-near');
    expect(ids('clear', ['wind'], 'fall')).toEqual(expect.arrayContaining(['gusts-near', 'sun']));
    expect(ids('clear', ['heat'], 'summer')).toContain('heat-haze');
    expect(ids('clear', ['cold'])).toContain('frost-a');
    for (const sky of ['clear', 'cloudy', 'fog', 'drizzle', 'rain', 'storm', 'snow'] as const) {
      const all = ids(sky, ['wind', 'heat', 'cold']);
      expect(new Set(all).size).toBe(all.length);
    }
  });
});

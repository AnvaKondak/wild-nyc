import { encounters, facts, getSpecies, moments, places, seasonChapters, sightings, species } from '@/content';
import { pickAround, poolFor, type StoryContext } from '../neighborStory';
import { recordedAnySeason, recordedHere, THIN, type Sightings } from '../sightings';

const ctx = (sightings: Sightings): StoryContext => ({
  allSpecies: species,
  moments,
  facts,
  chapters: seasonChapters,
  encounters,
  sightings,
  season: 'fall',
  period: 'midday',
  live: new Map(),
  weather: [],
});
const heron = getSpecies('great-blue-heron')!;
const bee = getSpecies('western-honey-bee')!;
const ids = (list: { id: string }[]) => list.map((s) => s.id);

// A bay-side block where herons really turn up, with plenty of records overall.
const allYear = (counts: Record<string, number>) => ({ spring: counts, summer: counts, fall: counts, winter: counts });
const busy: Record<string, number> = Object.fromEntries(
  species.filter((s) => s.seasons.includes('fall') && s.spots.block && s.id !== 'raccoon').slice(0, THIN).map((s) => [s.id, 12]),
);

describe('recordedHere', () => {
  it('needs a handful of records, fewer for bugs, and says when there is no data', () => {
    const data: Sightings = { bay: allYear({ 'great-blue-heron': 3, 'western-honey-bee': 2, 'mute-swan': 1 }) };
    expect(recordedHere(heron, data, 'bay', 'fall')).toBe(true);
    expect(recordedHere(bee, data, 'bay', 'fall')).toBe(true);
    expect(recordedHere(getSpecies('mute-swan')!, data, 'bay', 'fall')).toBe(false); // one stray record
    expect(recordedHere(heron, data, 'elsewhere', 'fall')).toBeUndefined();
    expect(recordedAnySeason(heron, data, 'bay')).toBe(true);
  });
});

describe('poolFor with the sightings snapshot', () => {
  it('lets real records put a waterbird on a city block, and leave out the unrecorded', () => {
    const data: Sightings = { bensonhurst: allYear({ ...busy, 'great-blue-heron': 8 }) };
    const pool = ids(poolFor('block', ctx(data), 'bensonhurst'));
    expect(pool).toContain('great-blue-heron'); // a block, but herons are really there
    expect(pool).not.toContain('raccoon'); // a usual block neighbor, but never recorded here
  });

  it('fills in with the usual neighbors where records are thin', () => {
    const data: Sightings = { quiet: allYear({ 'great-blue-heron': 4 }) };
    const pool = ids(poolFor('block', ctx(data), 'quiet'));
    expect(pool).toContain('great-blue-heron');
    expect(pool).toContain('rock-pigeon');
  });

  it('uses the usual neighbors for places without data', () => {
    const pool = ids(poolFor('block', ctx({}), 'nowhere'));
    expect(pool).toContain('rock-pigeon');
    expect(pool).not.toContain('great-blue-heron');
  });
});

describe('the real snapshot', () => {
  const real = (season: 'fall' | 'summer', placeId: string, kind: 'block' | 'park' | 'waterfront') =>
    ids(poolFor(kind, { ...ctx(sightings), season }, placeId));

  it('puts deer where they live, not where a park next door spills over', () => {
    expect(real('fall', 'liberty-state-park', 'waterfront')).toContain('white-tailed-deer');
    expect(real('fall', 'van-cortlandt-park', 'park')).toContain('white-tailed-deer');
    expect(real('fall', 'downtown-jc', 'block')).not.toContain('white-tailed-deer');
    expect(real('fall', 'park-slope', 'block')).not.toContain('white-tailed-deer');
  });

  it('always shows Liberty State Park\'s deer in "Also around today"', () => {
    const lsp = { cell: 'x', kind: 'waterfront' as const, placeName: 'Liberty State Park', where: 'by the water', local: places.find((p) => p.id === 'liberty-state-park')!.local, placeId: 'liberty-state-park' };
    for (const period of ['dawn', 'midday', 'dusk', 'night'] as const) {
      const around = pickAround(lsp, { ...ctx(sightings), period }, getSpecies('herring-gull'), `seed:${period}`);
      expect(around.map((s) => s.id)).toContain('white-tailed-deer');
    }
  });
});

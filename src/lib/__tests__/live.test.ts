import type { StorySlide } from '@/content/types';
import { fetchNeighborhood, orderStory, rankByLive, seenLabel, toLiveMap, type NeighborhoodReport } from '../live';

const report: NeighborhoodReport = {
  cell: 'dr5rke',
  status: 'ready',
  updatedAt: '2026-10-01T16:00:00Z',
  species: [
    { id: 'american-robin', recent: 14, year: 200, lastSeenOn: '2026-09-29', weekly: [] },
    { id: 'rock-pigeon', recent: 6, year: 62, lastSeenOn: '2026-09-10', weekly: [] },
    { id: 'dark-eyed-junco', recent: 0, year: 36, lastSeenOn: '2026-04-15', weekly: [] },
  ],
  sources: [{ name: 'iNaturalist', url: 'https://www.inaturalist.org' }],
};
const live = toLiveMap(report);
const today = new Date(2026, 9, 1);

describe('fetchNeighborhood', () => {
  it('sends only the cell, with no credentials', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: true, json: async () => report })) as unknown as typeof fetch;
    const result = await fetchNeighborhood('dr5rke', { baseUrl: 'http://api.test', fetchImpl });
    expect(result?.cell).toBe('dr5rke');
    const [url, init] = (fetchImpl as unknown as jest.Mock).mock.calls[0];
    expect(url).toBe('http://api.test/v1/neighborhoods/dr5rke');
    expect(init.credentials).toBe('omit');
  });

  it('never sends anything that is not a cell', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    expect(await fetchNeighborhood('40.67,-73.98', { baseUrl: 'http://api.test', fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('falls back quietly when offline or when there is no server', async () => {
    const failing = jest.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect(await fetchNeighborhood('dr5rke', { baseUrl: 'http://api.test', fetchImpl: failing })).toBeNull();
    expect(await fetchNeighborhood('dr5rke', { baseUrl: null })).toBeNull();
  });
});

describe('seenLabel', () => {
  it('uses words, never counts', () => {
    expect(seenLabel(live.get('american-robin'), today)).toBe('Seen nearby this week');
    expect(seenLabel(live.get('rock-pigeon'), today)).toBe('Seen nearby this month');
    expect(seenLabel(live.get('dark-eyed-junco'), today)).toBe('Last seen nearby in April');
    expect(seenLabel(undefined, today)).toBeNull();
    for (const s of report.species) expect(seenLabel(s, today)).not.toMatch(/\d/);
  });
});

describe('rankByLive', () => {
  it('puts recently seen species first and keeps the rest in order', () => {
    const items = [{ id: 'moths' }, { id: 'dark-eyed-junco' }, { id: 'rock-pigeon' }, { id: 'raccoon' }, { id: 'american-robin' }];
    expect(rankByLive(items, live).map((i) => i.id)).toEqual(['american-robin', 'rock-pigeon', 'dark-eyed-junco', 'moths', 'raccoon']);
  });

  it('changes nothing without live data', () => {
    const items = [{ id: 'b' }, { id: 'a' }];
    expect(rankByLive(items, new Map())).toBe(items);
  });
});

describe('orderStory', () => {
  const slide = (id: string, speciesId?: string, kind?: StorySlide['kind']): StorySlide => ({
    id, season: 'fall', period: 'dawn', kicker: '', title: '', body: '', speciesId, kind,
  });

  it('moves locally seen species forward and keeps chapters last', () => {
    const slides = [slide('squirrels', 'eastern-gray-squirrel'), slide('pigeons', 'rock-pigeon'), slide('chorus', 'american-robin'), slide('arriving', 'dark-eyed-junco', 'arriving'), slide('goodbye', 'chimney-swift', 'goodbye')];
    expect(orderStory(slides, live).map((s) => s.id)).toEqual(['pigeons', 'chorus', 'squirrels', 'arriving', 'goodbye']);
  });
});

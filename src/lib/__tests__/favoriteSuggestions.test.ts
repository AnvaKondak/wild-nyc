import { places, sightings, species } from '@/content';
import { SUGGESTED, suggestFavorites } from '../favoriteSuggestions';

const at = (id: string) => {
  const p = places.find((x) => x.id === id)!;
  return suggestFavorites(species, { placeId: p.id, kind: p.kind }, sightings).map((s) => s.id);
};

describe('suggestFavorites', () => {
  it('suggests ten, pigeons first, everywhere', () => {
    for (const p of places) {
      const ids = at(p.id);
      expect(ids[0]).toBe('rock-pigeon');
      expect(ids).toHaveLength(10);
      expect(new Set(ids).size).toBe(10);
    }
  });

  it('every suggested id is a real species', () => {
    for (const id of SUGGESTED) expect(species.some((s) => s.id === id)).toBe(true);
  });

  it("puts a place's own neighbors near the front", () => {
    expect(at('central-park').slice(0, 3)).toContain('coyote');
    expect(at('st-george').slice(0, 3)).toContain('wild-turkey');
  });

  it('never suggests turkeys where they are not', () => {
    expect(at('central-park')).not.toContain('wild-turkey');
  });

  it('works before a neighborhood is picked', () => {
    const ids = suggestFavorites(species, undefined, sightings).map((s) => s.id);
    expect(ids[0]).toBe('rock-pigeon');
    expect(ids).toHaveLength(10);
  });
});

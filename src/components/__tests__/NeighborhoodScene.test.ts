import { species } from '@/content';
import { placeSpecies } from '../NeighborhoodScene';

describe('placeSpecies', () => {
  it('finds a spot in the scene for every species', () => {
    const placed = placeSpecies(species).map((p) => p.species.id);
    expect(placed.sort()).toEqual(species.map((s) => s.id).sort());
  });

  it('never stacks two species on the same slot', () => {
    const slots = placeSpecies(species).map((p) => `${p.x},${p.y}`);
    expect(new Set(slots).size).toBe(slots.length);
  });
});

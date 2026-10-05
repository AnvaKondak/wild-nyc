import { species } from '@/content';
import { placeResidents, SCENES } from '../scenes';
import { placeSpecies } from '../scenes/NeighborhoodScene';

describe('Neighbors scenes', () => {
  it('give every species a sticker in its home scene', () => {
    const placed = [...placeSpecies(species), ...placeResidents('park', species), ...placeResidents('waterfront', species)].map((p) => p.species.id);
    expect(placed.sort()).toEqual(species.map((s) => s.id).sort());
  });

  it('never stack two species on the same slot', () => {
    for (const placements of [placeSpecies(species), placeResidents('park', species), placeResidents('waterfront', species)]) {
      const slots = placements.map((p) => `${p.x},${p.y}`);
      expect(new Set(slots).size).toBe(slots.length);
    }
  });

  it('only use spots that exist in each Places scene', () => {
    for (const s of species) {
      for (const kind of ['block', 'park', 'waterfront'] as const) {
        const spot = s.spots[kind];
        if (spot) expect(SCENES[kind].slots[spot]?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });
});

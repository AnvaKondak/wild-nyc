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

describe('scene slots', () => {
  it('are far enough apart that stickers never overlap', () => {
    const MIN = 44; // a sticker is 46–48 units across; allow a hair of touching
    const clashes: string[] = [];
    for (const [kind, scene] of Object.entries(SCENES)) {
      const all = Object.entries(scene.slots).flatMap(([spot, list]) => (list ?? []).map((s) => ({ spot, ...s })));
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        const apart = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
        if (apart < MIN) clashes.push(`${kind}: ${a.spot} (${a.x},${a.y}) / ${b.spot} (${b.x},${b.y})`);
      }
    }
    expect(clashes).toEqual([]);
  });
});

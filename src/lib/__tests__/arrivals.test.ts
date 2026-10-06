import { getSpecies, species, stories } from '@/content';
import { arrivalSlide, arrivalsAmong, daysSinceArrival, justArrived } from '../arrivals';
import { seededRandom } from '../random';

const local = { green: ['McCarren Park'], water: ['the East River'], landmark: ['the Domino sugar sign'], street: ['Bedford Avenue'] };

describe('just arrived', () => {
  const wtsp = getSpecies('white-throated-sparrow')!;

  it('counts days since the usual arrival, across the new year', () => {
    expect(daysSinceArrival(wtsp, new Date(2026, 9, 6))).toBe(11);
    expect(daysSinceArrival(getSpecies('red-winged-blackbird')!, new Date(2027, 1, 20))).toBe(356); // not back yet
    expect(daysSinceArrival(getSpecies('rock-pigeon')!, new Date(2026, 9, 6))).toBeNull();
  });

  it('lasts about three weeks', () => {
    expect(justArrived(wtsp, new Date(2026, 8, 25))).toBe(true);
    expect(justArrived(wtsp, new Date(2026, 9, 14))).toBe(true);
    expect(justArrived(wtsp, new Date(2026, 9, 20))).toBe(false);
  });

  it('puts the newest arrivals first', () => {
    expect(arrivalsAmong(species, new Date(2026, 9, 6)).map((s) => s.id)).toEqual(['hermit-thrush', 'yellow-rumped-warbler', 'white-throated-sparrow']);
  });

  it('every migrant has an arrival story for the season they arrive in', () => {
    for (const s of species.filter((x) => x.arrives)) {
      const slide = arrivalSlide(s, stories, new Date(2026, 0, 1), 'near Williamsburg', local, [], seededRandom('a'));
      expect([s.id, slide?.kicker]).toEqual([s.id, 'Just arrived']);
      expect(slide!.title + slide!.body).not.toMatch(/[{}]/);
    }
    const hermit = arrivalSlide(getSpecies('hermit-thrush')!, stories, new Date(2026, 9, 6), 'near Williamsburg', local, ['wind'], seededRandom('b'))!;
    expect(hermit.title).toMatch(/slipping in from the north/);
    expect(hermit.body).toMatch(/north wind/);
  });
});

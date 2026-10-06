import { getSpecies, moments, placeKinds, species } from '@/content';
import { dayInTheLife, homeSetting } from '../profile';

describe('dayInTheLife', () => {
  it('tells a day from dawn to night, in order, with real places', () => {
    const day = dayInTheLife(getSpecies('raccoon')!, 'fall', moments, 'on your block', placeKinds.block.local, '2026-10-06');
    expect(day.map((b) => b.period)).toEqual(['dawn', 'midday', 'dusk', 'night']);
    for (const b of day) expect(b.title + b.body).not.toMatch(/[{}]/);
  });

  it('gives everyone at least a few beats in every season they are here', () => {
    for (const s of species) for (const season of s.seasons) {
      expect([s.id, season, dayInTheLife(s, season, moments, 'nearby', placeKinds.park.local, 'x').length >= 2]).toEqual([s.id, season, true]);
    }
  });
});

describe('homeSetting', () => {
  it('draws where they like to be', () => {
    expect(homeSetting(getSpecies('rock-pigeon')!)).toBe('ledge');
    expect(homeSetting(getSpecies('red-winged-blackbird')!)).toBe('reeds');
  });
});

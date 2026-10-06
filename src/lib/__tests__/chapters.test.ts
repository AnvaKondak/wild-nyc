import { getSpecies } from '@/content';
import { chapterSlides, placeFor } from '../chapters';

describe('chapterSlides', () => {
  it.each(['spring', 'summer', 'fall', 'winter'] as const)('tells %s as a story: overview, neighbors together, then comings and goings', (season) => {
    const slides = chapterSlides(season);
    expect(slides.length).toBeGreaterThanOrEqual(8);
    expect(slides[0].kicker).toBe(`The ${season} chapter`);
    expect(new Set(slides.map((s) => s.id)).size).toBe(slides.length);
    for (const s of slides) {
      expect(s.title + s.body).not.toMatch(/[{}]/);
      expect(s.species.length).toBeGreaterThan(0);
      for (const id of s.species) expect(getSpecies(id)).toBeDefined();
    }
    const kinds = slides.map((s) => (s.kicker.includes('Arriving') ? 'in' : s.kicker.includes('Goodbye') ? 'out' : 'story'));
    expect(kinds.lastIndexOf('story')).toBeLessThan(kinds.indexOf('in'));
    expect(kinds.lastIndexOf('in')).toBeLessThan(kinds.indexOf('out'));
  });

  it('draws each story where its neighbors live', () => {
    expect(placeFor(['brant', 'bufflehead', 'common-tern'])).toBe('waterfront');
    expect(placeFor(['eastern-gray-squirrel', 'blue-jay'])).toBe('park');
  });
});

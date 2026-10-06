import { getSpecies } from '@/content';
import { chapterSlides, placeFor } from '../chapters';

describe('chapterSlides', () => {
  it.each(['spring', 'summer', 'fall', 'winter'] as const)('tells %s as a story: overview, neighbors together, then comings and goings', (season) => {
    const slides = chapterSlides(season);
    expect(slides.length).toBeGreaterThanOrEqual(8);
    expect(slides[0].kicker).toMatch(/ in NYC & Jersey City$/);
    expect(slides[0].place).toBe('waterfront');
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

  it('speaks for the whole region, not one neighborhood', () => {
    for (const season of ['spring', 'summer', 'fall', 'winter'] as const) {
      for (const s of chapterSlides(season)) expect(s.body).not.toMatch(/\b(the neighborhood|near you|your block)\b/i);
    }
    expect(chapterSlides('fall').some((s) => s.body.includes('around NYC and Jersey City'))).toBe(true);
  });
});

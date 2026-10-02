import type { StorySlide } from '@/content/types';
import { buildStory } from '../story';

const slide = (over: Partial<StorySlide>): StorySlide => ({
  id: over.id ?? 'x',
  season: 'fall',
  period: 'dawn',
  kicker: 'Right now',
  title: 'Title',
  body: 'Body',
  ...over,
});

const slides: StorySlide[] = [
  slide({ id: 'goodbye', period: 'any', kind: 'goodbye' }),
  slide({ id: 'dawn-1', body: 'Listen {where}.' }),
  slide({ id: 'park-only', places: ['park'] }),
  slide({ id: 'arriving', period: 'any', kind: 'arriving' }),
  slide({ id: 'dawn-2' }),
  slide({ id: 'dusk-1', period: 'dusk' }),
  slide({ id: 'winter', season: 'winter' }),
];

describe('buildStory', () => {
  it('shows scenes for the period, then arriving, then goodbye', () => {
    const story = buildStory(slides, { season: 'fall', period: 'dawn', placeKind: 'block', where: 'on your block' });
    expect(story.map((s) => s.id)).toEqual(['dawn-1', 'dawn-2', 'arriving', 'goodbye']);
  });

  it('includes place-specific slides only in that kind of place', () => {
    const story = buildStory(slides, { season: 'fall', period: 'dawn', placeKind: 'park', where: 'in the park' });
    expect(story.map((s) => s.id)).toContain('park-only');
  });

  it('fills in {where}', () => {
    const story = buildStory(slides, { season: 'fall', period: 'dawn', placeKind: 'park', where: 'in the park' });
    expect(story[0].body).toBe('Listen in the park.');
  });

  it('still ends with the chapter slides in other periods', () => {
    const story = buildStory(slides, { season: 'fall', period: 'dusk', placeKind: 'block', where: '' });
    expect(story.map((s) => s.id)).toEqual(['dusk-1', 'arriving', 'goodbye']);
  });
});

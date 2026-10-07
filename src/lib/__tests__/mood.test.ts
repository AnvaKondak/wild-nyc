import type { StorySlide } from '@/content/types';
import { moodFromWords, withMoods } from '../mood';

const slide = (id: string, title: string, body = ''): StorySlide => ({ id, season: 'fall', period: 'dusk', kicker: '', title, body, kind: 'scene' });

describe('moodFromWords', () => {
  it('reads what the neighbor is doing', () => {
    expect(moodFromWords('The crows are heading to roost')).toBe('sleepy');
    expect(moodFromWords('Fast asleep in a hollow tree')).toBe('sleepy');
    expect(moodFromWords('Burying acorns for winter')).toBe('snack');
    expect(moodFromWords('The robins are pulling up worms')).toBe('snack');
    expect(moodFromWords('A whole song from the fire escape')).toBe('happy');
    expect(moodFromWords('They look around the corner')).toBeUndefined();
  });

  it('puts sleeping ahead of eating when both are said', () => {
    expect(moodFromWords('After a big meal, they doze in the sun')).toBe('sleepy');
  });
});

describe('withMoods', () => {
  it('lets the title decide, then the body', () => {
    const [a] = withMoods([slide('x', 'Settling in to roost', 'They ate well today.')]);
    expect(a.mood).toBe('sleepy');
    const [b] = withMoods([slide('x', 'Look who it is', 'They are snacking on seeds.')]);
    expect(b.mood).toBe('snack');
  });

  it('says goodbye happy, and takes turns when the words say nothing', () => {
    const moods = withMoods([slide('a', 'Over here'), slide('b', 'And there'), slide('c', 'Still here'), slide('crow:kindness', "Don't feed them bread")]).map((s) => s.mood);
    expect(moods).toEqual(['hello', 'happy', 'hello', 'happy']);
  });
});

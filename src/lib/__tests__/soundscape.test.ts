import { soundAssets } from '@/content/soundAssets';
import { SOUNDSCAPE } from '../soundscape';

describe('the sound', () => {
  it('is one loop of birds, the same everywhere', () => {
    expect(SOUNDSCAPE).toBe('birds');
    expect(Object.keys(soundAssets)).toEqual(['birds']);
  });
});

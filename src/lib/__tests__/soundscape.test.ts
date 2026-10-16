import { hasWater } from '@/components/scene/looks';
import { pickSoundscape } from '../soundscape';

describe('pickSoundscape', () => {
  it('is soft birdsong everywhere, with water only where there is water', () => {
    expect(pickSoundscape({ water: false, favorites: false })).toBe('birds');
    expect(pickSoundscape({ water: true, favorites: false })).toBe('birds-water');
  });

  it('is always just the birdsong in favorites', () => {
    expect(pickSoundscape({ water: true, favorites: true })).toBe('birds');
  });
});

describe('hasWater', () => {
  it('knows which neighborhoods are by the water', () => {
    expect(hasWater('brooklyn-bridge-park', 'waterfront')).toBe(true);
    expect(hasWater('williamsburg', 'block')).toBe(true); // the East River
    expect(hasWater('bed-stuy', 'block')).toBe(false);
    expect(hasWater('park-slope', 'block')).toBe(false);
    expect(hasWater(undefined, 'waterfront')).toBe(true);
    expect(hasWater(undefined, 'block')).toBe(false);
  });
});

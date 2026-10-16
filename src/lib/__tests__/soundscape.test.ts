import { pickSoundscape } from '../soundscape';

describe('pickSoundscape', () => {
  it('plays waves and birds only in the neighborhoods right on the water', () => {
    for (const placeId of ['coney-island', 'red-hook', 'brooklyn-bridge-park', 'rockaway-beach', 'battery-park-city', 'exchange-place']) {
      expect(pickSoundscape({ placeId, favorites: false })).toBe('birds-water');
    }
  });

  it('plays just the birdsong everywhere else', () => {
    for (const placeId of ['williamsburg', 'upper-west-side', 'park-slope', 'central-park', 'liberty-state-park', undefined]) {
      expect(pickSoundscape({ placeId, favorites: false })).toBe('birds');
    }
  });

  it('is always just the birdsong in favorites', () => {
    expect(pickSoundscape({ placeId: 'coney-island', favorites: true })).toBe('birds');
  });
});

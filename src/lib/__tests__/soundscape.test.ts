import { pickSoundscape } from '../soundscape';

describe('pickSoundscape', () => {
  it('sounds like the kind of place: birds by day, crickets by night', () => {
    expect(pickSoundscape('park', 'dawn')).toBe('park-day');
    expect(pickSoundscape('park', 'night', ['cold'])).toBe('park-night');
    expect(pickSoundscape('waterfront', 'midday')).toBe('waterfront-day');
    expect(pickSoundscape('block', 'dusk', ['wind'])).toBe('block-night');
  });

  it('plays the rain when it rains, wherever and whenever', () => {
    expect(pickSoundscape('park', 'dawn', ['rain', 'wind'])).toBe('rain');
    expect(pickSoundscape('waterfront', 'night', ['rain'])).toBe('rain');
  });
});

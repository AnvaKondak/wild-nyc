import { pickSoundscape } from '../soundscape';

describe('pickSoundscape', () => {
  it('sounds like the kind of place: birds by day, crickets by night', () => {
    expect(pickSoundscape('park', 'dawn', 'spring')).toBe('park-day');
    expect(pickSoundscape('park', 'night', 'summer', ['cold'])).toBe('park-night');
    expect(pickSoundscape('waterfront', 'midday', 'fall')).toBe('waterfront-day');
    expect(pickSoundscape('block', 'dusk', 'fall', ['wind'])).toBe('block-night');
  });

  it('has no crickets on winter nights', () => {
    expect(pickSoundscape('park', 'night', 'winter')).toBe('park-winter-night');
    expect(pickSoundscape('block', 'dusk', 'winter')).toBe('block-winter-night');
    expect(pickSoundscape('waterfront', 'dawn', 'winter')).toBe('waterfront-day');
  });

  it('plays the rain when it rains, wherever and whenever', () => {
    expect(pickSoundscape('park', 'dawn', 'spring', ['rain', 'wind'])).toBe('rain');
    expect(pickSoundscape('waterfront', 'night', 'winter', ['rain'])).toBe('rain');
  });
});

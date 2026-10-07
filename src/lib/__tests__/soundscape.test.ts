import { pickSoundscape } from '../soundscape';

describe('pickSoundscape', () => {
  it('sounds like the kind of place', () => {
    expect(pickSoundscape('waterfront')).toBe('waterfront');
    expect(pickSoundscape('park', ['cold'])).toBe('park');
    expect(pickSoundscape('block', ['wind'])).toBe('block');
  });

  it('plays the rain when it rains, wherever you are', () => {
    expect(pickSoundscape('park', ['rain', 'wind'])).toBe('rain');
    expect(pickSoundscape('waterfront', ['rain'])).toBe('rain');
  });
});

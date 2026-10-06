import { pickSoundscape } from '../soundscape';

describe('pickSoundscape', () => {
  it('follows the season and time of day', () => {
    expect(pickSoundscape('spring', 'dawn')).toBe('dawn-chorus');
    expect(pickSoundscape('summer', 'night')).toBe('summer-night');
    expect(pickSoundscape('winter', 'midday')).toBe('winter-day');
    expect(pickSoundscape('fall', 'night')).toBe('fall-night');
  });

  it('lets weather you can hear win', () => {
    expect(pickSoundscape('summer', 'night', 'rain', ['rain', 'wind'])).toBe('rain');
    expect(pickSoundscape('winter', 'dawn', 'snow', ['snow'])).toBe('snow');
    expect(pickSoundscape('fall', 'midday', 'clear', ['wind'])).toBe('wind');
    expect(pickSoundscape('fall', 'midday', 'fog', ['fog'])).toBe('fall-day');
  });
});

import { pickSoundscape } from '../soundscape';

describe('pickSoundscape', () => {
  it('follows the season and time of day', () => {
    expect(pickSoundscape('spring', 'dawn', 'block')).toBe('dawn-chorus');
    expect(pickSoundscape('summer', 'night', 'park')).toBe('summer-night');
    expect(pickSoundscape('winter', 'midday', 'block')).toBe('winter-day');
    expect(pickSoundscape('fall', 'night', 'block')).toBe('fall-night');
  });

  it('plays waves and gulls by the water', () => {
    expect(pickSoundscape('spring', 'dawn', 'waterfront')).toBe('harbor');
    expect(pickSoundscape('spring', 'night', 'waterfront')).toBe('harbor-night');
  });

  it('lets weather you can hear win', () => {
    expect(pickSoundscape('summer', 'night', 'park', 'rain', ['rain', 'wind'])).toBe('rain');
    expect(pickSoundscape('winter', 'dawn', 'waterfront', 'snow', ['snow'])).toBe('snow');
    expect(pickSoundscape('fall', 'midday', 'block', 'clear', ['wind'])).toBe('wind');
    expect(pickSoundscape('fall', 'midday', 'block', 'fog', ['fog'])).toBe('fall-day');
  });
});

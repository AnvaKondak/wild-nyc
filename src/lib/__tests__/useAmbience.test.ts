import { assignSlots, voiceFor } from '../useAmbience';

jest.mock('expo-audio', () => ({ setAudioModeAsync: jest.fn(), useAudioPlayer: jest.fn() }));

describe('assignSlots', () => {
  it('fills slots with the story animal first', () => {
    expect(assignSlots([], ['cardinal', 'jay', 'crow', 'robin'])).toEqual(['cardinal', 'jay', 'crow']);
  });

  it('keeps animals who are still wanted in their slot, so they never restart', () => {
    const before = ['cardinal', 'jay', 'crow'];
    // Visiting the robin: the robin comes in, the cardinal and jay keep playing where they were.
    expect(assignSlots(before, ['robin', 'cardinal', 'jay', 'crow'])).toEqual(['cardinal', 'jay', 'robin']);
    // A neighborhood with only the jay: everyone else fades out, the jay carries on.
    expect(assignSlots(before, ['jay'])).toEqual([null, 'jay', null]);
  });
});

describe('voiceFor', () => {
  it('only finds voices we have recordings for', () => {
    expect(voiceFor('northern-cardinal')).not.toBeNull();
    expect(voiceFor('raccoon')).toBeNull();
    expect(voiceFor(undefined)).toBeNull();
  });
});

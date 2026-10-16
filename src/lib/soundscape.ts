// Which ambient loop plays behind the story: soft, calm birdsong everywhere, at every
// time of day, with soft moving water added only where the neighborhood has water. The
// favorites story spans the whole city, so it's always just the birdsong.
// The loops are mixed by scripts/build_soundscapes.py.

export type Soundscape = 'birds' | 'birds-water';

export function pickSoundscape({ water, favorites }: { water: boolean; favorites: boolean }): Soundscape {
  return water && !favorites ? 'birds-water' : 'birds';
}

/** What the loop is, in words, for the sound button's label. */
export const SOUNDSCAPE_LABEL: Record<Soundscape, string> = {
  birds: 'soft birdsong',
  'birds-water': 'soft birdsong and water',
};
